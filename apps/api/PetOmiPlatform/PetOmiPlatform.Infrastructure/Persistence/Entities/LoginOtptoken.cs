using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class LoginOtptoken
{
    public Guid LoginOtpid { get; set; }

    public Guid UserId { get; set; }

    public string Otpcode { get; set; } = null!;

    public int AttemptCount { get; set; }

    public DateTime ExpiresAt { get; set; }

    public bool IsUsed { get; set; }

    public string? Ipaddress { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
