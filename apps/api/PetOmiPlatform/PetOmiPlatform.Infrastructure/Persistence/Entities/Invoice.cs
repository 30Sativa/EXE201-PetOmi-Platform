using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Invoice
{
    public Guid InvoiceId { get; set; }

    public Guid AppointmentId { get; set; }

    public Guid? ExaminationId { get; set; }

    public Guid ClinicId { get; set; }

    public string InvoiceCode { get; set; } = null!;

    public decimal TotalAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal FinalAmount { get; set; }

    public string Status { get; set; } = null!;

    public string PaymentProvider { get; set; } = null!;

    public string? PaymentReference { get; set; }

    public string? QrCodeUrl { get; set; }

    public string? BankAccountNo { get; set; }

    public string? BankCode { get; set; }

    public decimal? PaidAmount { get; set; }

    public DateTime? PaymentWebhookAt { get; set; }

    public string? PaymentMethod { get; set; }

    public string? CancellationReason { get; set; }

    public Guid? CancelledByUserId { get; set; }

    public DateTime? CancelledAt { get; set; }

    public bool RequiresManualRefund { get; set; }

    public DateTime? PaidAt { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Appointment Appointment { get; set; } = null!;

    public virtual Clinic Clinic { get; set; } = null!;

    public virtual MedicalExamination? Examination { get; set; }

    public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();

    public virtual ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
}
