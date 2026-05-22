namespace PetOmiPlatform.Application.Features.Prescription.DTOs.Request
{
    public class AddPrescriptionItemRequest
    {
        public string MedicationName { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public int DurationDays { get; set; }
        public string? Instructions { get; set; }
        public Guid? InventoryItemId { get; set; }
    }
}
