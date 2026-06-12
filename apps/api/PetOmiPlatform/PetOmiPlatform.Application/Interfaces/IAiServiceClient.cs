using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Interfaces;

public interface IAiServiceClient
{
    Task EnqueueChatAsync(
        Guid messageId,
        Guid conversationId,
        Guid userId,
        string content,
        Guid? petId,
        string subscriptionPlan = "free",
        int priorityLevel = 0,
        bool deepRagEnabled = false,
        CancellationToken cancellationToken = default);
}
