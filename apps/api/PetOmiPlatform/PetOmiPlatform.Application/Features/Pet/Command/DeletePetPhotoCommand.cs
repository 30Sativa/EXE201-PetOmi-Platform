using MediatR;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record DeletePetPhotoCommand(Guid UserId, Guid PetId, Guid PhotoId) : IRequest;
}
