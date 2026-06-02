using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class OrderItem
{
    public Guid OrderItemId { get; set; }

    public Guid OrderId { get; set; }

    public Guid InventoryItemId { get; set; }

    public string Description { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal TotalPrice { get; set; }

    public string SourceType { get; set; } = null!;

    public Guid? PrescriptionId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Inventory InventoryItem { get; set; } = null!;

    public virtual Order Order { get; set; } = null!;

    public virtual Prescription? Prescription { get; set; }

    public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
}
