using System;

namespace PetOmiPlatform.Application.Features.ClinicReview.DTOs.Response
{
    public class ClinicReviewResponse
    {
        public Guid ReviewId { get; set; }
        public Guid ClinicId { get; set; }
        public Guid OwnerUserId { get; set; }
        public Guid? AppointmentId { get; set; }
        public int Rating { get; set; }
        public string ReviewContent { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
