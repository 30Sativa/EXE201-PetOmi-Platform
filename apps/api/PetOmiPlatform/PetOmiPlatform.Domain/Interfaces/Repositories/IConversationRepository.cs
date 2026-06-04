using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IConversationRepository
    {
        Task<ConversationDomain?> GetByIdAsync(Guid conversationId);
        Task<List<ConversationDomain>> GetByUserIdAsync(Guid userId, int take = 50);
        Task<ConversationDomain?> GetOrCreateAsync(Guid userId, Guid? petId = null);
        Task AddAsync(ConversationDomain conversation);
        Task UpdateAsync(ConversationDomain conversation);
    }
}
