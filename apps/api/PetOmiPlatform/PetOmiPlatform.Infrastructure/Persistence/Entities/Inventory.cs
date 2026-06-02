using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Inventory
{
    public Guid ItemId { get; set; }

    public Guid ClinicId { get; set; }

    public string ItemName { get; set; } = null!;

    public string? Unit { get; set; }

    public int Quantity { get; set; }

    public int LowStockThreshold { get; set; }

    public decimal? UnitPrice { get; set; }

    public DateOnly? ExpiryDate { get; set; }

    public string? ImageUrl { get; set; }

    public string? ImageCloudinaryPublicId { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Clinic Clinic { get; set; } = null!;

    public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
