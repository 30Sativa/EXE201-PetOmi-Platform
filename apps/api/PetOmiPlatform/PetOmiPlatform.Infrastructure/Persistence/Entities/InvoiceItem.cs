using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class InvoiceItem
{
    public Guid InvoiceItemId { get; set; }

    public Guid InvoiceId { get; set; }

    public string ItemType { get; set; } = null!;

    public string Description { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal TotalPrice { get; set; }

    public Guid? ServiceId { get; set; }

    public Guid? InventoryItemId { get; set; }

    public Guid? OrderItemId { get; set; }

    public Guid? PrescriptionId { get; set; }

    public virtual Inventory? InventoryItem { get; set; }

    public virtual Invoice Invoice { get; set; } = null!;

    public virtual OrderItem? OrderItem { get; set; }

    public virtual Prescription? Prescription { get; set; }

    public virtual ClinicService? Service { get; set; }
}
