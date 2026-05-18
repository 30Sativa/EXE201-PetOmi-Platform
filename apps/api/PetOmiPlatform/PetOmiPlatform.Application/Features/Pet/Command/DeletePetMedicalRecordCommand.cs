using MediatR;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record DeletePetMedicalRecordCommand(Guid UserId, Guid PetId, Guid MedicalRecordId) : IRequest;
}
