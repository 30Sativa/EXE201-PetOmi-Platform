using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class User
{
    public Guid UserId { get; set; }

    public string Email { get; set; } = null!;

    public string NormalizedEmail { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public bool EmailVerified { get; set; }

    public int FailedLoginAttempts { get; set; }

    public DateTime? LockoutUntil { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual ICollection<Clinic> Clinics { get; set; } = new List<Clinic>();

    public virtual ICollection<EmailVerificationToken> EmailVerificationTokens { get; set; } = new List<EmailVerificationToken>();

    public virtual ICollection<LoginOtptoken> LoginOtptokens { get; set; } = new List<LoginOtptoken>();

    public virtual ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<UserDevice> UserDevices { get; set; } = new List<UserDevice>();

    public virtual UserProfile? UserProfile { get; set; }

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();

    public virtual VetProfile? VetProfile { get; set; }
}
