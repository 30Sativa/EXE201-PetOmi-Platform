using MediatR;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Request;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.UserProfile.Command
{
    public record UpdateUserProfileCommand(Guid UserId, UpdateUserProfileRequest Request)
        : IRequest<UserProfileResponse>;
}
