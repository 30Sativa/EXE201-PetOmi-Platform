using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.BackgroundServices;

public class AiTaskQueue : IAiTaskQueue
{
    private readonly Channel<AiProcessTask> _queue;
    private readonly ConcurrentDictionary<Guid, byte> _cancelledMessages = new();

    public AiTaskQueue()
    {
        _queue = Channel.CreateBounded<AiProcessTask>(new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait
        });
    }

    public async ValueTask EnqueueAsync(AiProcessTask task, CancellationToken ct = default)
    {
        await _queue.Writer.WriteAsync(task, ct);
    }

    public async ValueTask<AiProcessTask> DequeueAsync(CancellationToken ct)
    {
        return await _queue.Reader.ReadAsync(ct);
    }

    public void Cancel(Guid messageId)
    {
        _cancelledMessages.TryAdd(messageId, 0);
    }

    public bool IsCancelled(Guid messageId)
    {
        return _cancelledMessages.ContainsKey(messageId);
    }
}

public class AiBackgroundService : BackgroundService
{
    private readonly IAiTaskQueue _queue;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AiBackgroundService> _logger;
    private readonly string _aiServiceBaseUrl;
    private readonly string _webhookBaseUrl;
    private readonly string? _webhookSecret;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly TimeSpan _responseTimeout;

    public AiBackgroundService(
        IAiTaskQueue queue,
        IHttpClientFactory httpClientFactory,
        ILogger<AiBackgroundService> logger,
        Microsoft.Extensions.Configuration.IConfiguration configuration,
        IServiceScopeFactory scopeFactory)
    {
        _queue = queue;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _aiServiceBaseUrl = NormalizeBaseUrl(
            configuration["AiService:BaseUrl"],
            "http://127.0.0.1:8000");
        _webhookBaseUrl = NormalizeBaseUrl(
            configuration["AiService:WebhookBaseUrl"],
            "http://127.0.0.1:5273");
        _webhookSecret = configuration["AiService:WebhookSecret"];
        _scopeFactory = scopeFactory;
        var responseTimeoutSeconds = configuration.GetValue<int?>("AiService:ResponseTimeoutSeconds") ?? 120;
        if (responseTimeoutSeconds < 30)
        {
            responseTimeoutSeconds = 30;
        }
        _responseTimeout = TimeSpan.FromSeconds(responseTimeoutSeconds);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "AI background worker started. AiServiceBaseUrl={AiServiceBaseUrl}, WebhookBaseUrl={WebhookBaseUrl}",
            _aiServiceBaseUrl,
            _webhookBaseUrl);

        while (!stoppingToken.IsCancellationRequested)
        {
            AiProcessTask task;
            try
            {
                task = await _queue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try
            {
                await ProcessTaskAsync(task, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process AI task for message {MessageId}.", task.MessageId);
            }
        }

        _logger.LogInformation("AI background worker stopped.");
    }

    private async Task ProcessTaskAsync(AiProcessTask task, CancellationToken ct)
    {
        if (_queue.IsCancelled(task.MessageId))
        {
            _logger.LogInformation("Skipping cancelled AI task for message {MessageId}.", task.MessageId);
            return;
        }

        var client = _httpClientFactory.CreateClient("AiService");

        var payload = new
        {
            message_id = task.MessageId.ToString(),
            conversation_id = task.ConversationId.ToString(),
            user_id = task.UserId.ToString(),
            content = task.Content,
            pet_id = task.PetId?.ToString(),
            subscription_plan = task.SubscriptionPlan,
            priority_level = task.PriorityLevel,
            deep_rag_enabled = task.DeepRagEnabled,
            webhook_url = $"{_webhookBaseUrl.TrimEnd('/')}/api/chat/webhook/ai-response"
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(30));

        try
        {
            var response = await client.PostAsync($"{_aiServiceBaseUrl}/api/chat/process", content, cts.Token);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Message {MessageId} dispatched to AI service.", task.MessageId);
                _ = Task.Run(
                    () => MarkMessageFailedAfterTimeoutAsync(task, _responseTimeout, ct),
                    CancellationToken.None);
            }
            else
            {
                var errorBody = await response.Content.ReadAsStringAsync(cts.Token);
                _logger.LogWarning(
                    "AI service returned {StatusCode} for message {MessageId}. Body: {ErrorBody}",
                    response.StatusCode, task.MessageId, errorBody);
                await _markMessageFailedAsync(task, "AI service returned an error.", ct);
            }
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning(
                "AI service timeout (30s) for message {MessageId}. Marking as failed.",
                task.MessageId);
            await _markMessageFailedAsync(task, "Yêu cầu hết thời gian chờ, vui lòng thử lại.", ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to dispatch message {MessageId} to AI service.",
                task.MessageId);
            await _markMessageFailedAsync(task, "Yêu cầu hết thời gian chờ, vui lòng thử lại.", ct);
        }
    }

    private async Task _markMessageFailedAsync(AiProcessTask task, string friendlyError, CancellationToken ct)
    {
        try
        {
            var errorPayload = new
            {
                message_id = task.MessageId.ToString(),
                conversation_id = task.ConversationId.ToString(),
                user_id = task.UserId.ToString(),
                response = "",
                status = "failed",
                error_message = friendlyError,
                webhook_url = $"{_webhookBaseUrl.TrimEnd('/')}/api/chat/webhook/ai-response"
            };

            var json = JsonSerializer.Serialize(errorPayload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(10));

            var client = _httpClientFactory.CreateClient("AiService");
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"{_webhookBaseUrl.TrimEnd('/')}/api/chat/webhook/ai-response")
            {
                Content = content
            };

            if (!string.IsNullOrWhiteSpace(_webhookSecret))
            {
                request.Headers.Add("X-Webhook-Secret", _webhookSecret);
            }

            await client.SendAsync(request, cts.Token);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to notify webhook for failed message {MessageId}.",
                task.MessageId);
        }
    }

    private async Task MarkMessageFailedAfterTimeoutAsync(
        AiProcessTask task,
        TimeSpan timeout,
        CancellationToken ct)
    {
        try
        {
            await Task.Delay(timeout, ct);

            using var scope = _scopeFactory.CreateScope();
            var messageRepository = scope.ServiceProvider.GetRequiredService<IChatMessageRepository>();
            var message = await messageRepository.GetByIdAsync(task.MessageId);

            if (message == null
                || message.Status is MessageStatus.Completed or MessageStatus.Failed or MessageStatus.Cancelled)
            {
                return;
            }

            _logger.LogWarning(
                "AI service did not complete message {MessageId} within {TimeoutSeconds}s. Marking as failed.",
                task.MessageId,
                timeout.TotalSeconds);

            await _markMessageFailedAsync(
                task,
                "Yeu cau het thoi gian cho, vui long thu lai.",
                ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "AI timeout monitor failed for message {MessageId}.",
                task.MessageId);
        }
    }

    private static string NormalizeBaseUrl(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value)
            ? fallback
            : value.Trim().TrimEnd('/');
    }
}
