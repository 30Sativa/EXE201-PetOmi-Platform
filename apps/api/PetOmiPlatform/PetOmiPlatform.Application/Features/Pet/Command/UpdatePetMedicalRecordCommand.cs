using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record UpdatePetMedicalRecordCommand(
        Guid UserId,
        Guid PetId,
        Guid MedicalRecordId,
        UpdatePetMedicalRecordRequest Request) : IRequest<PetMedicalRecordResponse>;
}
