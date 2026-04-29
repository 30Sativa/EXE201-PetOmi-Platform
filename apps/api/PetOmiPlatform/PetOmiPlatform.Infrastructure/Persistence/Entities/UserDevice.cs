using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class UserDevice
{
    public Guid DeviceId { get; set; }

    public Guid UserId { get; set; }

    public string DeviceName { get; set; } = null!;

    public string? DeviceType { get; set; }

    public string? DeviceToken { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public bool IsBlocked { get; set; }

    public string? UserAgent { get; set; }

    public string? DeviceFingerprint { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual User User { get; set; } = null!;

    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
}
