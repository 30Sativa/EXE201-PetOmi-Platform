using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record UpdatePetAccessCommand(
        Guid UserId,
        Guid PetId,
        Guid AccessId,
        UpdatePetAccessRequest Request) : IRequest<PetUserAccessResponse>;
}
