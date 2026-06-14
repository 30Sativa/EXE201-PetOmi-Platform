using MediatR;
using PetOmiPlatform.Application.Features.ClinicReview.DTOs.Response;
using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.ClinicReview.Query
{
    public record GetMyClinicReviewsQuery(Guid OwnerUserId) : IRequest<List<ClinicReviewResponse>>;
}
