namespace PetOmiPlatform.Application.Features.Prescription.DTOs.Request
{
    public class UpdatePrescriptionItemRequest
    {
        public string? MedicationName { get; set; }
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public int? DurationDays { get; set; }
        public string? Instructions { get; set; }
        public Guid? InventoryItemId { get; set; }
    }
}
