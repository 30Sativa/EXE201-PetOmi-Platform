using MediatR;
using PetOmiPlatform.Application.Features.ClinicReview.DTOs.Response;
using PetOmiPlatform.Application.Features.ClinicReview.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.ClinicReview.Handler
{
    public class GetClinicReviewsQueryHandler
        : IRequestHandler<GetClinicReviewsQuery, ClinicReviewSummaryResponse>
    {
        private readonly IClinicReviewRepository _reviewRepository;

        public GetClinicReviewsQueryHandler(IClinicReviewRepository reviewRepository)
        {
            _reviewRepository = reviewRepository;
        }

        public async Task<ClinicReviewSummaryResponse> Handle(
            GetClinicReviewsQuery query, CancellationToken cancellationToken)
        {
            var reviews = await _reviewRepository.GetByClinicIdAsync(query.ClinicId);
            var (count, average) = await _reviewRepository.GetClinicStatsAsync(query.ClinicId);

            return new ClinicReviewSummaryResponse
            {
                TotalReviews = count,
                AverageRating = Math.Round(average, 1),
                Reviews = reviews.Select(r => new ClinicReviewResponse
                {
                    ReviewId = r.Id,
                    ClinicId = r.ClinicId,
                    OwnerUserId = r.OwnerUserId,
                    AppointmentId = r.AppointmentId,
                    Rating = r.Rating,
                    ReviewContent = r.ReviewContent,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                }).ToList()
            };
        }
    }
}
