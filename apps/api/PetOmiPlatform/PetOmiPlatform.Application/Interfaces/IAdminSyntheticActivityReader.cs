namespace PetOmiPlatform.Application.Interfaces;

public interface IAdminSyntheticActivityReader
{
    Task<AdminSyntheticActivityReadModel> ReadAsync(
        DateTime fromUtc,
        DateTime toExclusiveUtc,
        bool isSynthetic,
        CancellationToken cancellationToken = default);
}

public sealed class AdminSyntheticActivityReadModel
{
    public List<SyntheticActivityUserReadModel> Users { get; init; } = new();
    public List<SyntheticActivityPetReadModel> Pets { get; init; } = new();
    public List<SyntheticActivitySessionReadModel> Sessions { get; init; } = new();
    public List<SyntheticActivityMessageReadModel> Messages { get; init; } = new();
    public List<SyntheticActivityMedicalNoteReadModel> MedicalNotes { get; init; } = new();
    public List<SyntheticActivityReminderReadModel> Reminders { get; init; } = new();
}

public sealed record SyntheticActivityUserReadModel(
    Guid UserId,
    string Email,
    string? FullName,
    DateTime CreatedAt);

public sealed record SyntheticActivityPetReadModel(
    Guid PetId,
    Guid UserId,
    string Name,
    DateTime CreatedAt);

public sealed record SyntheticActivitySessionReadModel(
    Guid UserId,
    DateTime CreatedAt,
    DateTime? LogoutAt);

public sealed record SyntheticActivityMessageReadModel(
    Guid MessageId,
    Guid ConversationId,
    Guid UserId,
    string SenderRole,
    DateTime CreatedAt);

public sealed record SyntheticActivityMedicalNoteReadModel(
    Guid MedicalRecordId,
    Guid UserId,
    DateTime CreatedAt);

public sealed record SyntheticActivityReminderReadModel(
    Guid ReminderId,
    Guid UserId,
    DateTime CreatedAt);
