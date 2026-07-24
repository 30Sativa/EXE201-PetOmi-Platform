using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Infrastructure.BackgroundServices;

public class ChatSubscriptionPaymentExpiryService : BackgroundService
{
    private static readonly TimeSpan PollingInterval = TimeSpan.FromMinutes(1);

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ChatSubscriptionPaymentExpiryService> _logger;

    public ChatSubscriptionPaymentExpiryService(
        IServiceProvider serviceProvider,
        ILogger<ChatSubscriptionPaymentExpiryService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var repository = scope.ServiceProvider.GetRequiredService<IChatSubscriptionRepository>();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                await unitOfWork.BeginTransactionAsync();
                try
                {
                    var expiredCount = await repository.ExpirePendingPaymentsAsync(DateTime.UtcNow);
                    if (expiredCount > 0)
                    {
                        await unitOfWork.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation("Expired {PaymentCount} stale chat subscription payments", expiredCount);
                    }

                    await unitOfWork.CommitTransactionAsync();
                }
                catch
                {
                    await unitOfWork.RollbackTransactionAsync();
                    throw;
                }
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to expire stale chat subscription payments");
            }

            await Task.Delay(PollingInterval, stoppingToken);
        }
    }
}
