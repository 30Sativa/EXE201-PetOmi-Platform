using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Response
{
    public class PetMedicalRecordResponse
    {
        public Guid MedicalRecordId { get; set; }
        public Guid PetId { get; set; }
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
        public DateTime? UpdatedAt { get; set; }
    }
}
