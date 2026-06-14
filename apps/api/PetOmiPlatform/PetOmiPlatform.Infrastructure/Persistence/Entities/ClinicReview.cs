using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class ClinicReview
{
    public Guid ClinicReviewId { get; set; }

    public Guid ClinicId { get; set; }

    public Guid OwnerUserId { get; set; }

    public Guid? AppointmentId { get; set; }

    public int Rating { get; set; }

    public string ReviewContent { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public bool IsActive { get; set; }
}
