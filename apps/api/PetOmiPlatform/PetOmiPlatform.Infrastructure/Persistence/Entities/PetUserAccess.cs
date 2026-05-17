using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class PetUserAccess
{
    public Guid PetUserAccessId { get; set; }

    public Guid PetId { get; set; }

    public Guid UserId { get; set; }

    public string AccessRole { get; set; } = null!;

    public Guid? GrantedByUserId { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? GrantedByUser { get; set; }

    public virtual Pet Pet { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
