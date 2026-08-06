namespace PetOmiPlatform.Application.Interfaces;

public interface IAdminUserBehaviorReader
{
    Task<AdminUserBehaviorReadModel> ReadAsync(
        DateTime fromUtc,
        DateTime toExclusiveUtc,
        bool? isSynthetic,
        CancellationToken cancellationToken = default);
}

public sealed class AdminUserBehaviorReadModel
{
    public List<UserBehaviorUserReadModel> Users { get; init; } = new();
    public List<UserBehaviorPetReadModel> Pets { get; init; } = new();
    public List<UserBehaviorSessionReadModel> Sessions { get; init; } = new();
    public List<UserBehaviorMessageReadModel> Messages { get; init; } = new();
    public List<UserBehaviorMedicalNoteReadModel> MedicalNotes { get; init; } = new();
    public List<UserBehaviorReminderReadModel> Reminders { get; init; } = new();
}

public sealed record UserBehaviorUserReadModel(
    Guid UserId,
    string Email,
    string? FullName,
    bool IsSynthetic,
    DateTime CreatedAt);

public sealed record UserBehaviorPetReadModel(
    Guid PetId,
    Guid UserId,
    string Name,
    DateTime CreatedAt);

public sealed record UserBehaviorSessionReadModel(
    Guid UserId,
    DateTime CreatedAt,
    DateTime? LogoutAt);

public sealed record UserBehaviorMessageReadModel(
    Guid MessageId,
    Guid ConversationId,
    Guid UserId,
    string SenderRole,
    string Content,
    string? Intent,
    DateTime CreatedAt);

public sealed record UserBehaviorMedicalNoteReadModel(
    Guid MedicalRecordId,
    Guid UserId,
    DateTime CreatedAt);

public sealed record UserBehaviorReminderReadModel(
    Guid ReminderId,
    Guid UserId,
    DateTime CreatedAt);
