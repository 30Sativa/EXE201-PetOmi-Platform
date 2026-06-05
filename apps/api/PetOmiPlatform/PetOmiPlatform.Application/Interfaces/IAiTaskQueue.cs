using System;
using System.Threading;
using System.Threading.Channels;

namespace PetOmiPlatform.Application.Interfaces;

public record AiProcessTask(
    Guid MessageId,
    Guid ConversationId,
    Guid UserId,
    string Content,
    Guid? PetId,
    CancellationToken CancellationToken);

public interface IAiTaskQueue
{
    ValueTask EnqueueAsync(AiProcessTask task, CancellationToken ct = default);
    ValueTask<AiProcessTask> DequeueAsync(CancellationToken ct);
    void Cancel(Guid messageId);
    bool IsCancelled(Guid messageId);
}
