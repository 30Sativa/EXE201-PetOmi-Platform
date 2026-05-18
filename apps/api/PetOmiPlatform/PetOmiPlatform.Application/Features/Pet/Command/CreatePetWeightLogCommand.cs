using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record CreatePetWeightLogCommand(
        Guid UserId,
        Guid PetId,
        CreatePetWeightLogRequest Request) : IRequest<PetWeightLogResponse>;
}
