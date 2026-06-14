using System;

namespace PetOmiPlatform.Application.Features.ClinicReview.DTOs.Request
{
    public class CreateClinicReviewRequest
    {
        public Guid ClinicId { get; set; }
        public Guid? AppointmentId { get; set; }
        public int Rating { get; set; }
        public string ReviewContent { get; set; } = null!;
    }
}
