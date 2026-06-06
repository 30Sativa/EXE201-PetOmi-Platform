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

        public async Task<ChatAiDashboardStats> GetAiDashboardStatsAsync(DateTime fromUtc)
        {
            var aiMessages = _context.ChatMessages
                .AsNoTracking()
                .Where(m => m.IsActive && (m.SenderRole == "AI" || m.SenderRole == "assistant"));

            var aiMessagesSince = aiMessages.Where(m => m.CreatedAt >= fromUtc);

            var totalAiResponses = await aiMessages.CountAsync();
            var aiResponsesSince = await aiMessagesSince.CountAsync();
            var ragResponses = await aiMessages.CountAsync(m => m.RagUsed);
            var ragResponsesSince = await aiMessagesSince.CountAsync(m => m.RagUsed);
            var failedResponsesSince = await aiMessagesSince.CountAsync(m => m.Status == "Failed" || m.Status == "failed");
            var activeConversationsSince = await _context.ChatMessages
                .AsNoTracking()
                .Where(m => m.IsActive && m.CreatedAt >= fromUtc)
                .Select(m => m.ConversationId)
                .Distinct()
                .CountAsync();

            var averageChunksUsedSince = await aiMessagesSince
                .Select(m => (decimal?)m.ChunksUsed)
                .AverageAsync() ?? 0;

            var sourceBackedResponsesSince = await aiMessagesSince.CountAsync(m =>
                m.SourcesJson != null &&
                m.SourcesJson != "" &&
                m.SourcesJson != "[]");

            var totalTokensSince = await aiMessagesSince.SumAsync(m => m.TokensInput + m.TokensOutput);

            return new ChatAiDashboardStats
            {
                TotalAiResponses = totalAiResponses,
                AiResponsesSince = aiResponsesSince,
                RagResponses = ragResponses,
                RagResponsesSince = ragResponsesSince,
                FailedResponsesSince = failedResponsesSince,
                ActiveConversationsSince = activeConversationsSince,
                AverageChunksUsedSince = Math.Round(averageChunksUsedSince, 1),
                SourceBackedResponsesSince = sourceBackedResponsesSince,
                TotalTokensSince = totalTokensSince
            };
        }

        public async Task<List<ChatIntentDashboardStats>> GetIntentDashboardStatsAsync(DateTime fromUtc, int take = 5)
        {
            take = Math.Clamp(take, 1, 20);

            return await _context.ChatMessages
                .AsNoTracking()
                .Where(m =>
                    m.IsActive &&
                    (m.SenderRole == "AI" || m.SenderRole == "assistant") &&
                    m.CreatedAt >= fromUtc &&
                    m.Intent != null &&
                    m.Intent != "")
                .GroupBy(m => m.Intent!)
                .Select(group => new ChatIntentDashboardStats
                {
                    Intent = group.Key,
                    Count = group.Count(),
                    RagCount = group.Count(m => m.RagUsed)
                })
                .OrderByDescending(item => item.Count)
                .ThenBy(item => item.Intent)
                .Take(take)
                .ToListAsync();
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
