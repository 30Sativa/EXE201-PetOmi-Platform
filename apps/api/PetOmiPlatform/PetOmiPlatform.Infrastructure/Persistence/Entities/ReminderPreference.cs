using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class ReminderPreference
{
    public Guid PreferenceId { get; set; }

    public Guid UserId { get; set; }

    public string ReminderType { get; set; } = null!;

    public bool IsEnabled { get; set; }

    public int? RemindBeforeMinutes { get; set; }

    public string Channel { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
