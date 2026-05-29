namespace PetOmiPlatform.Application.Features.Appointment.DTOs.Request
{
    /// <summary>
    /// Tiep nhan nhanh khach vang lai: tao owner tam + pet tam + walk-in appointment.
    /// </summary>
    public class CreateGuestWalkInIntakeRequest
    {
        public Guid ClinicId { get; set; }

        // Guest owner basic info
        public string OwnerFullName { get; set; } = null!;
        public string OwnerPhone { get; set; } = null!;
        public string? OwnerAddress { get; set; }

        // Pet basic info
        public string PetName { get; set; } = null!;
        public string PetSpecies { get; set; } = null!; // Dog/Cat
        public string? PetBreed { get; set; }
        public string? PetGender { get; set; } // Male/Female/Unknown
        public DateOnly? PetDateOfBirth { get; set; }
        public bool IsPetBirthDateEstimated { get; set; }

        // Appointment info
        public Guid? VetClinicId { get; set; }
        public Guid? ServiceId { get; set; }
        public DateOnly AppointmentDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public string AppointmentType { get; set; } = "Checkup";
        public string? Notes { get; set; }
    }
}
