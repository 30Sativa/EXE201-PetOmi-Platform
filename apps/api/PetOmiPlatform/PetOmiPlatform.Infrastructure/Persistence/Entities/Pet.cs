using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Pet
{
    public Guid PetId { get; set; }

    public Guid OwnerUserId { get; set; }

    public string Name { get; set; } = null!;

    public string Species { get; set; } = null!;

    public string? Breed { get; set; }

    public string? Gender { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public bool IsBirthDateEstimated { get; set; }

    public string? AvatarUrl { get; set; }

    public bool IsActive { get; set; }

    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User OwnerUser { get; set; } = null!;

    public virtual PetHealthProfile? PetHealthProfile { get; set; }

    public virtual ICollection<PetMedicalRecord> PetMedicalRecords { get; set; } = new List<PetMedicalRecord>();

    public virtual ICollection<PetPhoto> PetPhotos { get; set; } = new List<PetPhoto>();

    public virtual ICollection<PetUserAccess> PetUserAccesses { get; set; } = new List<PetUserAccess>();

    public virtual ICollection<PetWeightLog> PetWeightLogs { get; set; } = new List<PetWeightLog>();
}
