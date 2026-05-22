namespace PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Request
{
    public class CreateExaminationRequest
    {
        public Guid AppointmentId { get; set; }
        
        // SOAP: S
        public string ChiefComplaint { get; set; } = string.Empty;
        
        // SOAP: O
        public decimal? WeightKg { get; set; }
        public decimal? TemperatureC { get; set; }
        public int? HeartRate { get; set; }
        public int? RespiratoryRate { get; set; }
        public string? ExaminationNotes { get; set; }
        
        // SOAP: A
        public string? Diagnosis { get; set; }
        
        // SOAP: P
        public string? TreatmentPlan { get; set; }
    }
}
