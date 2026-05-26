using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class PaymentTransaction
{
    public Guid PaymentTransactionId { get; set; }

    public Guid? InvoiceId { get; set; }

    public Guid ClinicId { get; set; }

    public string Provider { get; set; } = null!;

    public string ProviderTransactionId { get; set; } = null!;

    public string? ReferenceCode { get; set; }

    public string? TransferContent { get; set; }

    public string TransferType { get; set; } = null!;

    public decimal TransferAmount { get; set; }

    public string? Gateway { get; set; }

    public string? AccountNumber { get; set; }

    public DateTime? TransactionDate { get; set; }

    public bool IsMatched { get; set; }

    public string? RawPayload { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Clinic Clinic { get; set; } = null!;

    public virtual Invoice? Invoice { get; set; }
}
