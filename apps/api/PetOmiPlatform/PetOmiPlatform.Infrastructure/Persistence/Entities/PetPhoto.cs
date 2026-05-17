using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class PetPhoto
{
    public Guid PhotoId { get; set; }

    public Guid PetId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? Caption { get; set; }

    public bool IsAvatar { get; set; }

    public DateTime? TakenAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public bool IsActive { get; set; }

    public virtual Pet Pet { get; set; } = null!;
}
