using MediatR;
using PetOmiPlatform.Application.Features.Chat.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Chat.Query;

public class GetConversationMessagesQuery(Guid UserId, Guid ConversationId, int Skip = 0, int Take = 50)
    : IRequest<List<ChatMessageResponse>>
{
    public Guid UserId { get; } = UserId;
    public Guid ConversationId { get; } = ConversationId;
    public int Skip { get; } = Skip;
    public int Take { get; } = Take;
}

public class GetConversationMessagesQueryHandler : IRequestHandler<GetConversationMessagesQuery, List<ChatMessageResponse>>
{
    private readonly IChatMessageRepository _chatMessageRepository;

    public GetConversationMessagesQueryHandler(IChatMessageRepository chatMessageRepository)
    {
        _chatMessageRepository = chatMessageRepository;
    }

    public async Task<List<ChatMessageResponse>> Handle(GetConversationMessagesQuery query, CancellationToken ct)
    {
        var result = await _chatMessageRepository.GetConversationWithMessagesAsync(
            query.ConversationId, query.Skip, query.Take);

        if (result == null)
            throw new UnauthorizedAccessException("Access denied or conversation not found.");

        if (result.Value.Conversation?.UserId != query.UserId)
            throw new UnauthorizedAccessException("Access denied or conversation not found.");

        var responses = new List<ChatMessageResponse>();
        foreach (var msg in result.Value.Messages)
        {
            responses.Add(new ChatMessageResponse
            {
                MessageId = msg.Id,
                ConversationId = msg.ConversationId,
                SenderRole = msg.SenderRole.ToString(),
                Status = msg.Status.ToString(),
                Content = msg.Content,
                Intent = msg.Intent,
                UrgencyLevel = msg.UrgencyLevel,
                RagUsed = msg.RagUsed,
                ChunksUsed = msg.ChunksUsed,
                Model = msg.Model,
                TokensInput = msg.TokensInput,
                TokensOutput = msg.TokensOutput,
                Sources = DeserializeSources(msg.SourcesJson),
                VetRecommendation = msg.VetRecommendation,
                IsActive = msg.IsActive,
                CreatedAt = msg.CreatedAt
            });
        }
        return responses;
    }

    private static List<SourceEntryDto> DeserializeSources(string? sourcesJson)
    {
        if (string.IsNullOrWhiteSpace(sourcesJson))
            return new List<SourceEntryDto>();

        try
        {
            return JsonSerializer.Deserialize<List<SourceEntryDto>>(sourcesJson) ?? new List<SourceEntryDto>();
        }
        catch
        {
            return new List<SourceEntryDto>();
        }
    }
}
