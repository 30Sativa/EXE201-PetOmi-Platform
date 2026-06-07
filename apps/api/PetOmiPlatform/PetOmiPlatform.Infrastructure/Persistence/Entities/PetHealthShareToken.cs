using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class PetHealthShareToken
{
    public Guid ShareTokenId { get; set; }

    public Guid PetId { get; set; }

    public Guid OwnerUserId { get; set; }

    public Guid? ClinicId { get; set; }

    public string DisplayCode { get; set; } = null!;

    public string TokenHash { get; set; } = null!;

    public string Scope { get; set; } = null!;

    public string AccessMode { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public int? MaxUses { get; set; }

    public int UsedCount { get; set; }

    public DateTime? LastUsedAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid CreatedByUserId { get; set; }

    public string? Note { get; set; }

    public virtual Clinic? Clinic { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual User OwnerUser { get; set; } = null!;

    public virtual Pet Pet { get; set; } = null!;
}
