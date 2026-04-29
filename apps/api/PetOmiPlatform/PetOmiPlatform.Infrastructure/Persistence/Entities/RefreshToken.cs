using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class RefreshToken
{
    public Guid RefreshTokenId { get; set; }

    public Guid UserId { get; set; }

    public Guid? DeviceId { get; set; }

    public string TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public bool IsRevoked { get; set; }

    public DateTime? RevokedAt { get; set; }

    public Guid? ReplacedByToken { get; set; }

    public string? CreatedByIp { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? LastUsedAt { get; set; }

    public virtual UserDevice? Device { get; set; }

    public virtual User User { get; set; } = null!;

    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
}
