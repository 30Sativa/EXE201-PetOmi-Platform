namespace PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response
{
    public class ExaminationResponse
    {
        public Guid Id { get; set; }
        public Guid AppointmentId { get; set; }
        public Guid PetId { get; set; }
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
}
