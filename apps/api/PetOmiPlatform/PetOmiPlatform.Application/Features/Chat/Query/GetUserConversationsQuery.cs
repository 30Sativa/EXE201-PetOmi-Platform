using MediatR;
using PetOmiPlatform.Application.Features.Chat.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Chat.Query;

public class GetUserConversationsQuery(Guid UserId, int Take = 50)
    : IRequest<List<ChatConversationResponse>>
{
    public Guid UserId { get; } = UserId;
    public int Take { get; } = Take;
}

public class GetUserConversationsQueryHandler : IRequestHandler<GetUserConversationsQuery, List<ChatConversationResponse>>
{
    private readonly IConversationRepository _conversationRepository;

    public GetUserConversationsQueryHandler(IConversationRepository conversationRepository)
    {
        _conversationRepository = conversationRepository;
    }

    public async Task<List<ChatConversationResponse>> Handle(GetUserConversationsQuery query, CancellationToken ct)
    {
        var conversations = await _conversationRepository.GetByUserIdAsync(query.UserId, query.Take);

        return conversations.Select(conversation => new ChatConversationResponse
        {
            ConversationId = conversation.Id,
            UserId = conversation.UserId,
            PetId = conversation.PetId,
            Title = conversation.Title,
            IsActive = conversation.IsActive,
            CreatedAt = conversation.CreatedAt,
            UpdatedAt = conversation.UpdatedAt
        }).ToList();
    }
}
