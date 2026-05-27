using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.Pet.Query
{
    // Query lấy timeline (activity feed) của 1 pet
    public record GetPetTimelineQuery(
        Guid UserId,
        Guid PetId,
        int Page = 1,
        int PageSize = 20,
        string? ActivityType = null,
        DateTime? FromDate = null,
        DateTime? ToDate = null
    ) : IRequest<PetTimelineResponse>;
}
