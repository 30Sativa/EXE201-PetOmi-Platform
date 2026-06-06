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
    Task<ChatAiDashboardStats> GetAiDashboardStatsAsync(DateTime fromUtc);
    Task<List<ChatIntentDashboardStats>> GetIntentDashboardStatsAsync(DateTime fromUtc, int take = 5);
    Task AddAsync(ChatMessageDomain message);
    Task UpdateAsync(ChatMessageDomain message);
}

public class ChatAiDashboardStats
{
    public int TotalAiResponses { get; set; }
    public int AiResponsesSince { get; set; }
    public int RagResponses { get; set; }
    public int RagResponsesSince { get; set; }
    public int FailedResponsesSince { get; set; }
    public int ActiveConversationsSince { get; set; }
    public decimal AverageChunksUsedSince { get; set; }
    public int SourceBackedResponsesSince { get; set; }
    public int TotalTokensSince { get; set; }
}

public class ChatIntentDashboardStats
{
    public string Intent { get; set; } = string.Empty;
    public int Count { get; set; }
    public int RagCount { get; set; }
}
