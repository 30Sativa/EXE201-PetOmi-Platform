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
    public class ChatMessageRepository : IChatMessageRepository
    {
        private readonly PetOmniDbContext _context;

        public ChatMessageRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<ChatMessageDomain?> GetByIdAsync(Guid messageId)
        {
            var entity = await _context.ChatMessages
                .FirstOrDefaultAsync(m => m.MessageId == messageId && m.IsActive);
            return entity?.ToDomain();
        }

        public async Task<List<ChatMessageDomain>> GetByConversationIdAsync(Guid conversationId, int skip = 0, int take = 50)
        {
            skip = Math.Max(0, skip);
            take = Math.Clamp(take, 1, 100);

            var entities = await _context.ChatMessages
                .Where(m => m.ConversationId == conversationId && m.IsActive)
                .OrderByDescending(m => m.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            return entities
                .OrderBy(e => e.CreatedAt)
                .Select(e => e.ToDomain())
                .ToList();
        }

        public async Task<(ConversationDomain? Conversation, List<ChatMessageDomain> Messages)?> GetConversationWithMessagesAsync(
            Guid conversationId, int skip = 0, int take = 50)
        {
            var conv = await _context.Conversations
                .Where(c => c.ConversationId == conversationId && c.IsActive)
                .FirstOrDefaultAsync();

            if (conv == null) return null;

            skip = Math.Max(0, skip);
            take = Math.Clamp(take, 1, 100);

            var messages = await _context.ChatMessages
                .Where(m => m.ConversationId == conversationId && m.IsActive)
                .OrderByDescending(m => m.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            return (
                conv.ToDomain(),
                messages
                    .OrderBy(e => e.CreatedAt)
                    .Select(e => e.ToDomain())
                    .ToList()
            );
        }

        public async Task AddAsync(ChatMessageDomain message)
        {
            await _context.ChatMessages.AddAsync(message.ToEntity());
        }

        public async Task UpdateAsync(ChatMessageDomain message)
        {
            var entity = await _context.ChatMessages.FindAsync(message.Id);
            if (entity == null) return;

            var updated = message.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
