namespace PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response
{
    public class PetHealthOverviewResponse
    {
        public PetHealthOverviewPetResponse Pet { get; set; } = null!;
        public PetHealthOverviewOwnerResponse? Owner { get; set; }
        public PetHealthOverviewProfileResponse? HealthProfile { get; set; }
        public List<PetHealthOverviewAlertResponse> Alerts { get; set; } = new();
        public List<PetHealthOverviewMedicalRecordResponse> MedicalRecords { get; set; } = new();
        public List<PetHealthOverviewExaminationResponse> Examinations { get; set; } = new();
        public List<PetHealthOverviewPrescriptionResponse> Prescriptions { get; set; } = new();
        public List<PetHealthOverviewAppointmentResponse> Appointments { get; set; } = new();
        public PetHealthOverviewAccessResponse Access { get; set; } = null!;
    }

    public class PetHealthOverviewPetResponse
    {
        public Guid PetId { get; set; }
        public string? PublicPetCode { get; set; }
        public string Name { get; set; } = null!;
        public string Species { get; set; } = null!;
        public string? Breed { get; set; }
        public string? Gender { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? AgeText { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class PetHealthOverviewOwnerResponse
    {
        public Guid OwnerUserId { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
    }

    public class PetHealthOverviewProfileResponse
    {
        public decimal? CurrentWeightKg { get; set; }
        public string? Color { get; set; }
        public string? IsNeutered { get; set; }
        public string? Allergies { get; set; }
        public string? ChronicConditions { get; set; }
        public string? MicrochipNumber { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class PetHealthOverviewAlertResponse
    {
        public string Type { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Severity { get; set; } = null!;
    }

    public class PetHealthOverviewMedicalRecordResponse
    {
        public Guid MedicalRecordId { get; set; }
        public string RecordType { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public DateOnly RecordDate { get; set; }
        public string? VetName { get; set; }
        public string? ClinicName { get; set; }
        public string? MedicationName { get; set; }
        public string? Dosage { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public string? AttachmentUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PetHealthOverviewExaminationResponse
    {
        public Guid ExaminationId { get; set; }
        public Guid AppointmentId { get; set; }
        public Guid? VetClinicId { get; set; }
        public string ChiefComplaint { get; set; } = string.Empty;
        public decimal? WeightKg { get; set; }
        public decimal? TemperatureC { get; set; }
        public int? HeartRate { get; set; }
        public int? RespiratoryRate { get; set; }
        public string? ExaminationNotes { get; set; }
        public string? Diagnosis { get; set; }
        public string? TreatmentPlan { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class PetHealthOverviewPrescriptionResponse
    {
        public Guid PrescriptionId { get; set; }
        public Guid ExaminationId { get; set; }
        public string MedicationName { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public int DurationDays { get; set; }
        public string? Instructions { get; set; }
        public Guid? InventoryItemId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PetHealthOverviewAppointmentResponse
    {
        public Guid AppointmentId { get; set; }
        public Guid ClinicId { get; set; }
        public Guid? VetClinicId { get; set; }
        public Guid? ServiceId { get; set; }
        public DateOnly AppointmentDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public string AppointmentType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public bool IsWalkIn { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PetHealthOverviewAccessResponse
    {
        public string Source { get; set; } = null!;
        public string Scope { get; set; } = null!;
        public DateTime? ExpiresAt { get; set; }
    }
}
