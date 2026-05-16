using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class UserSession
{
    public Guid SessionId { get; set; }

    public Guid UserId { get; set; }

    public Guid? RefreshTokenId { get; set; }

    public Guid? DeviceId { get; set; }

    public string? AccessTokenJti { get; set; }

    public string? Ipaddress { get; set; }

    public string? UserAgent { get; set; }

    public bool IsActive { get; set; }

    public DateTime? LogoutAt { get; set; }

    public DateTime LastActivityAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? ActiveRole { get; set; }

    public Guid? ActiveClinicId { get; set; }

    public virtual Clinic? ActiveClinic { get; set; }

    public virtual UserDevice? Device { get; set; }

    public virtual RefreshToken? RefreshToken { get; set; }

    public virtual User User { get; set; } = null!;
}
