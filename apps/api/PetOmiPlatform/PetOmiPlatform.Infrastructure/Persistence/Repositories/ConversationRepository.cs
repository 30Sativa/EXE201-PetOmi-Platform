using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class ConversationRepository : IConversationRepository
    {
        private readonly PetOmniDbContext _context;

        public ConversationRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<ConversationDomain?> GetByIdAsync(Guid conversationId)
        {
            var entity = await _context.Conversations
                .FirstOrDefaultAsync(c => c.ConversationId == conversationId && c.IsActive);
            return entity?.ToDomain();
        }

        public async Task<List<ConversationDomain>> GetByUserIdAsync(Guid userId, int take = 50)
        {
            var entities = await _context.Conversations
                .Where(c => c.UserId == userId && c.IsActive)
                .OrderByDescending(c => c.UpdatedAt ?? c.CreatedAt)
                .Take(take)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<ConversationDomain?> GetOrCreateAsync(Guid userId, Guid? petId = null)
        {
            var query = _context.Conversations
                .Where(c => c.UserId == userId && c.IsActive);

            if (petId.HasValue)
                query = query.Where(c => c.PetId == petId);

            var entity = await query
                .OrderByDescending(c => c.CreatedAt)
                .FirstOrDefaultAsync();

            if (entity != null)
                return entity.ToDomain();

            var newConversation = ConversationDomain.Create(userId, petId);
            await _context.Conversations.AddAsync(newConversation.ToEntity());
            return newConversation;
        }

        public async Task AddAsync(ConversationDomain conversation)
        {
            await _context.Conversations.AddAsync(conversation.ToEntity());
        }

        public async Task UpdateAsync(ConversationDomain conversation)
        {
            var entity = await _context.Conversations.FindAsync(conversation.Id);
            if (entity == null) return;

            var updated = conversation.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
