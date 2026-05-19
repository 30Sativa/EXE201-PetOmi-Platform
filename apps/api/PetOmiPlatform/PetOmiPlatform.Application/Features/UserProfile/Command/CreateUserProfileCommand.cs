using MediatR;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Request;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.UserProfile.Command
{
    public record CreateUserProfileCommand(Guid UserId, CreateUserProfileRequest Request)
        : IRequest<UserProfileResponse>;
}
