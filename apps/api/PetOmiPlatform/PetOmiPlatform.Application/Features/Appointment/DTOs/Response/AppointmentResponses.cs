namespace PetOmiPlatform.Application.Features.Appointment.DTOs.Response
{
    public class AppointmentResponse
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

        public string AppointmentType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        public string? Notes { get; set; }
        public string? CancellationReason { get; set; }
        public bool IsWalkIn { get; set; }
        public bool IsLateCancellation { get; set; }

        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AppointmentListItemResponse
    {
        public Guid AppointmentId { get; set; }
        public Guid ClinicId { get; set; }
        public Guid? ServiceId { get; set; }
        public Guid PetId { get; set; }
        public Guid? VetClinicId { get; set; }

        public DateOnly AppointmentDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }

        public string AppointmentType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsWalkIn { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AvailableSlotResponse
    {
        public Guid VetClinicId { get; set; }
        public string DoctorName { get; set; } = null!;
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class ClinicDoctorResponse
    {
        public Guid VetClinicId { get; set; }
        public Guid VetProfileId { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? Specialization { get; set; }
        public string RoleName { get; set; } = null!;
    }
}
