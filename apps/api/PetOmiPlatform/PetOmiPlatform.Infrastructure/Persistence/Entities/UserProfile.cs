using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class UserProfile
{
    public Guid ProfileId { get; set; }

    public Guid UserId { get; set; }

    public string? FullName { get; set; }

    public string? Phone { get; set; }

    public string? AvatarUrl { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? Address { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
