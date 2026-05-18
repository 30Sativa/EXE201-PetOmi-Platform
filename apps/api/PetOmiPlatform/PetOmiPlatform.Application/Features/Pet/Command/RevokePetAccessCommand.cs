using MediatR;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record RevokePetAccessCommand(Guid UserId, Guid PetId, Guid AccessId) : IRequest;
}
