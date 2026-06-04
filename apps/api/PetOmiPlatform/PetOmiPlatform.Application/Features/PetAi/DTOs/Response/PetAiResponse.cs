using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.PetAi.DTOs.Response;

public class PetBasicContextResponse
{
    public Guid PetId { get; set; }
    public string Name { get; set; } = null!;
    public string Species { get; set; } = null!;
    public string? Breed { get; set; }
    public string? Gender { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public bool IsBirthDateEstimated { get; set; }
    public string? AvatarUrl { get; set; }
    public Guid OwnerUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? AgeMonths { get; set; }
    public string? AgeFormatted { get; set; }
}

public class PetHealthProfileDto
{
    public Guid PetHealthProfileId { get; set; }
    public decimal? CurrentWeightKg { get; set; }
    public string? IsNeutered { get; set; }
    public string? Allergies { get; set; }
    public string? ChronicConditions { get; set; }
    public string? MicrochipNumber { get; set; }
    public string? Color { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PetWeightLogDto
{
    public Guid WeightLogId { get; set; }
    public decimal WeightKg { get; set; }
    public DateTime? MeasuredAt { get; set; }
    public string? Note { get; set; }
    public string? Source { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PetVaccinationDto
{
    public Guid MedicalRecordId { get; set; }
    public string? Title { get; set; }
    public string? RecordType { get; set; }
    public string? ClinicName { get; set; }
    public string? VetName { get; set; }
    public string? MedicationName { get; set; }
    public string? Dosage { get; set; }
    public DateOnly? RecordDate { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class PetMedicalRecordDto
{
    public Guid MedicalRecordId { get; set; }
    public string? Title { get; set; }
    public string? RecordType { get; set; }
    public string? Description { get; set; }
    public DateOnly? RecordDate { get; set; }
    public string? ClinicName { get; set; }
    public string? VetName { get; set; }
    public string? MedicationName { get; set; }
    public string? Dosage { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? AttachmentUrl { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class PetMedicalSummaryResponse
{
    public Guid PetId { get; set; }
    public PetHealthProfileDto? HealthProfile { get; set; }
    public List<PetWeightLogDto> RecentWeightLogs { get; set; } = new();
    public List<PetVaccinationDto> Vaccinations { get; set; } = new();
    public List<PetMedicalRecordDto> MedicalRecords { get; set; } = new();
}

public class ConversationMessageDto
{
    public Guid MessageId { get; set; }
    public string SenderRole { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? Intent { get; set; }
    public string? UrgencyLevel { get; set; }
    public bool RagUsed { get; set; }
    public int? ChunksUsed { get; set; }
    public string? Model { get; set; }
    public int TokensInput { get; set; }
    public int TokensOutput { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RecentMessagesResponse
{
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public Guid? PetId { get; set; }
    public string? Title { get; set; }
    public List<ConversationMessageDto> Messages { get; set; } = new();
    public int TotalCount { get; set; }
}

public class PetAiErrorResponse
{
    public string Error { get; set; } = null!;
    public string? Detail { get; set; }
}
