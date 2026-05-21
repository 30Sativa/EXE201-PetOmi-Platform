namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class InventoryItem
{
    public Guid ItemId { get; set; }

    public Guid ClinicId { get; set; }

    public string ItemName { get; set; } = null!;

    public string? Unit { get; set; }           // "viên", "ml", "lọ"

    public int Quantity { get; set; }

    public int LowStockThreshold { get; set; }

    public decimal? UnitPrice { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Clinic Clinic { get; set; } = null!;
}
