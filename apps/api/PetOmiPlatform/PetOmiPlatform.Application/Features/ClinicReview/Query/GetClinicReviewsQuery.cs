using MediatR;
using PetOmiPlatform.Application.Features.ClinicReview.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.ClinicReview.Query
{
    public record GetClinicReviewsQuery(Guid ClinicId) : IRequest<ClinicReviewSummaryResponse>;
}
