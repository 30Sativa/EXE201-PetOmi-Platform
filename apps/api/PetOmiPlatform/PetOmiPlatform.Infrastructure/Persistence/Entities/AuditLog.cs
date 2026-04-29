using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class AuditLog
{
    public Guid AuditLogId { get; set; }

    public Guid? UserId { get; set; }

    public string Action { get; set; } = null!;

    public string? EntityType { get; set; }

    public Guid? EntityId { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public string Severity { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string? Ipaddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? User { get; set; }
}
