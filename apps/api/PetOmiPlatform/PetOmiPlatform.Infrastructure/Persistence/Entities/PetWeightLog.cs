using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class PetWeightLog
{
    public Guid WeightLogId { get; set; }

    public Guid PetId { get; set; }

    public decimal WeightKg { get; set; }

    public DateTime MeasuredAt { get; set; }

    public string? Source { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Pet Pet { get; set; } = null!;
}
