using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record SetPetAvatarCommand(
        Guid UserId,
        Guid PetId,
        SetPetAvatarRequest Request) : IRequest<PetPhotoResponse>;
}
