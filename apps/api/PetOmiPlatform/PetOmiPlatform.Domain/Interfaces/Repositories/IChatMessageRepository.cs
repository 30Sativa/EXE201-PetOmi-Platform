using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories;

public interface IChatMessageRepository
{
    Task<ChatMessageDomain?> GetByIdAsync(Guid messageId);
    Task<List<ChatMessageDomain>> GetByConversationIdAsync(Guid conversationId, int skip = 0, int take = 50);
    Task<(ConversationDomain? Conversation, List<ChatMessageDomain> Messages)?> GetConversationWithMessagesAsync(
        Guid conversationId, int skip = 0, int take = 50);
    Task AddAsync(ChatMessageDomain message);
    Task UpdateAsync(ChatMessageDomain message);
}
