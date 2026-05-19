using MediatR;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.UserProfile.Query
{
    public record GetUserProfileQuery(Guid UserId) : IRequest<UserProfileResponse>;
}
