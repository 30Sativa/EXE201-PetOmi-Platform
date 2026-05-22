using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Appointment
{
    public Guid AppointmentId { get; set; }

    public Guid ClinicId { get; set; }

    public Guid? VetClinicId { get; set; }

    public Guid? ServiceId { get; set; }

    public Guid PetId { get; set; }

    public Guid BookedByUserId { get; set; }

    public DateOnly AppointmentDate { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public string AppointmentType { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? Notes { get; set; }

    public string? CancellationReason { get; set; }

    public bool IsWalkIn { get; set; }

    public bool IsLateCancellation { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public Guid? CancelledByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CheckedInAt { get; set; }

    public Guid? CheckedInByUserId { get; set; }

    public virtual User BookedByUser { get; set; } = null!;

    public virtual User? CancelledByUser { get; set; }

    public virtual User? CheckedInByUser { get; set; }

    public virtual Clinic Clinic { get; set; } = null!;

    public virtual Invoice? Invoice { get; set; }

    public virtual MedicalExamination? MedicalExamination { get; set; }

    public virtual Pet Pet { get; set; } = null!;

    public virtual ClinicService? Service { get; set; }

    public virtual VetClinic? VetClinic { get; set; }
}
