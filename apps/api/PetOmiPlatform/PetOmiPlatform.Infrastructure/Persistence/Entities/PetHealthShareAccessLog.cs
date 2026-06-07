using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class PetHealthShareAccessLog
{
    public Guid AccessLogId { get; set; }

    public Guid? ShareTokenId { get; set; }

    public Guid PetId { get; set; }

    public Guid? ClinicId { get; set; }

    public Guid? AccessedByUserId { get; set; }

    public string AccessType { get; set; } = null!;

    public string Result { get; set; } = null!;

    public string? FailureReason { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? AccessedByUser { get; set; }

    public virtual Clinic? Clinic { get; set; }

    public virtual Pet Pet { get; set; } = null!;

    public virtual PetHealthShareToken? ShareToken { get; set; }
}
