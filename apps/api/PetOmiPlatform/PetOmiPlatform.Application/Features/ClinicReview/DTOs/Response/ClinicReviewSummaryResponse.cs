using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.ClinicReview.DTOs.Response
{
    public class ClinicReviewSummaryResponse
    {
        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }
        public List<ClinicReviewResponse> Reviews { get; set; } = new();
    }
}
