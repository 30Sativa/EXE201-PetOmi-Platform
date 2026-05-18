using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record CreatePetHealthProfileCommand(
        Guid UserId,
        Guid PetId,
        CreatePetHealthProfileRequest Request) : IRequest<PetHealthProfileResponse>;
}
