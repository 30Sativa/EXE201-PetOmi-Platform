using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record GrantPetAccessCommand(
        Guid UserId,
        Guid PetId,
        GrantPetAccessRequest Request) : IRequest<PetUserAccessResponse>;
}
