using MediatR;
using PetOmiPlatform.Application.Features.ClinicReview.DTOs.Response;
using PetOmiPlatform.Application.Features.ClinicReview.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.ClinicReview.Handler
{
    public class GetMyClinicReviewsQueryHandler
        : IRequestHandler<GetMyClinicReviewsQuery, List<ClinicReviewResponse>>
    {
        private readonly IClinicReviewRepository _reviewRepository;

        public GetMyClinicReviewsQueryHandler(IClinicReviewRepository reviewRepository)
        {
            _reviewRepository = reviewRepository;
        }

        public async Task<List<ClinicReviewResponse>> Handle(
            GetMyClinicReviewsQuery query, CancellationToken cancellationToken)
        {
            var reviews = await _reviewRepository.GetByOwnerIdAsync(query.OwnerUserId);

            return reviews.Select(r => new ClinicReviewResponse
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
            }).ToList();
        }
    }
}
