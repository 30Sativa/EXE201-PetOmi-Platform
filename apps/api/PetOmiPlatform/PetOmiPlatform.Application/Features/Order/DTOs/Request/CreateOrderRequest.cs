namespace PetOmiPlatform.Application.Features.Order.DTOs.Request
{
    public class CreateOrderItemRequest
    {
        public Guid InventoryItemId { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal? UnitPrice { get; set; }
        public string? Description { get; set; }
        public string SourceType { get; set; } = "Retail";
        public Guid? PrescriptionId { get; set; }
    }

    public class CreateOrderRequest
    {
        public Guid ClinicId { get; set; }
        public Guid? CustomerUserId { get; set; }
        public Guid? PetId { get; set; }
        public Guid? AppointmentId { get; set; }
        public string OrderType { get; set; } = "Retail";
        public string? Notes { get; set; }
        public bool ConfirmImmediately { get; set; } = true;
        public List<CreateOrderItemRequest> Items { get; set; } = new();
    }
}
