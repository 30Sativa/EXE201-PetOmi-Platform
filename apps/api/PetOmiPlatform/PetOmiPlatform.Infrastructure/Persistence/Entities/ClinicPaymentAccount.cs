using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class ClinicPaymentAccount
{
    public Guid ClinicPaymentAccountId { get; set; }

    public Guid ClinicId { get; set; }

    public string Provider { get; set; } = null!;

    public string BankCode { get; set; } = null!;

    public string? BankName { get; set; }

    public string AccountNumber { get; set; } = null!;

    public string? AccountName { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Clinic Clinic { get; set; } = null!;
}
