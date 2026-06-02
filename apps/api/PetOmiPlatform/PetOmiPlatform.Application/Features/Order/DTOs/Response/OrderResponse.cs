namespace PetOmiPlatform.Application.Features.Order.DTOs.Response
{
    public class OrderItemResponse
    {
        public Guid OrderItemId { get; set; }
        public Guid InventoryItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string SourceType { get; set; } = string.Empty;
        public Guid? PrescriptionId { get; set; }
    }

    public class OrderResponse
    {
        public Guid OrderId { get; set; }
        public Guid ClinicId { get; set; }
        public Guid? CustomerUserId { get; set; }
        public Guid? PetId { get; set; }
        public Guid? AppointmentId { get; set; }
        public string OrderType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public List<OrderItemResponse> Items { get; set; } = new();
    }
}
