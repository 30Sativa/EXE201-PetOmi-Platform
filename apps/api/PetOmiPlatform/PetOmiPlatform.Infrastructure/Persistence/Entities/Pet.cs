using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

// EF Core entity tương ứng với bảng Pets trong DB
public partial class Pet
{
    public Guid PetId { get; set; }

    public Guid OwnerUserId { get; set; }           // FK → Users.UserID

    public string Name { get; set; } = null!;

    public string Species { get; set; } = null!;    // "Dog" / "Cat"

    public string? Breed { get; set; }

    public string? Gender { get; set; }             // "Male" / "Female" / "Unknown"

    public string? IsNeutered { get; set; }         // "Yes" / "No" / "Unknown"

    public DateOnly? DateOfBirth { get; set; }

    public bool IsBirthDateEstimated { get; set; }  // true = ngày sinh ước tính

    public string? AvatarUrl { get; set; }

    public string? Color { get; set; }

    public bool IsActive { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Navigation property
    public virtual User Owner { get; set; } = null!;
}
