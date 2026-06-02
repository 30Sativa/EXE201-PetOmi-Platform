using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Order
{
    public Guid OrderId { get; set; }

    public Guid ClinicId { get; set; }

    public Guid? CustomerUserId { get; set; }

    public Guid? PetId { get; set; }

    public Guid? AppointmentId { get; set; }

    public string OrderType { get; set; } = null!;

    public string Status { get; set; } = null!;

    public decimal TotalAmount { get; set; }

    public string? Notes { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public virtual Appointment? Appointment { get; set; }

    public virtual Clinic Clinic { get; set; } = null!;

    public virtual User? CustomerUser { get; set; }

    public virtual Pet? Pet { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
