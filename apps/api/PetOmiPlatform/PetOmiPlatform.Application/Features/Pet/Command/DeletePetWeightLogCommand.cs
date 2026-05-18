using MediatR;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record DeletePetWeightLogCommand(Guid UserId, Guid PetId, Guid WeightLogId) : IRequest;
}
