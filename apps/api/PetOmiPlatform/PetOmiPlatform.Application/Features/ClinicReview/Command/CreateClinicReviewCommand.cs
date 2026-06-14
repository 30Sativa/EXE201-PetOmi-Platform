using MediatR;
using PetOmiPlatform.Application.Features.ClinicReview.DTOs.Request;
using PetOmiPlatform.Application.Features.ClinicReview.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.ClinicReview.Command
{
    public record CreateClinicReviewCommand(Guid OwnerUserId, CreateClinicReviewRequest Request)
        : IRequest<ClinicReviewResponse>;
}
