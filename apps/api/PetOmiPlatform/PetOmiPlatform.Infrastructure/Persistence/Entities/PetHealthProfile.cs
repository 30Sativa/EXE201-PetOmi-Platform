using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class PetHealthProfile
{
    public Guid PetHealthProfileId { get; set; }

    public Guid PetId { get; set; }

    public decimal? CurrentWeightKg { get; set; }

    public string? Color { get; set; }

    public string? IsNeutered { get; set; }

    public string? Allergies { get; set; }

    public string? ChronicConditions { get; set; }

    public string? MicrochipNumber { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Pet Pet { get; set; } = null!;
}
