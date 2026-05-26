using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    public class CreatePetMedicalRecordRequest
    {
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
        public string? AttachmentCloudinaryPublicId { get; set; }
    }
}
