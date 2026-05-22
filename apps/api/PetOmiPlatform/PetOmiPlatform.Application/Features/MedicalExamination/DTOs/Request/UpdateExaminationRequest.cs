namespace PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Request
{
    public class UpdateExaminationRequest
    {
        public string? ChiefComplaint { get; set; }
        public decimal? WeightKg { get; set; }
        public decimal? TemperatureC { get; set; }
        public int? HeartRate { get; set; }
        public int? RespiratoryRate { get; set; }
        public string? ExaminationNotes { get; set; }
        public string? Diagnosis { get; set; }
        public string? TreatmentPlan { get; set; }
    }
}
