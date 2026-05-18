using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    public record CreatePetMedicalRecordCommand(
        Guid UserId,
        Guid PetId,
        CreatePetMedicalRecordRequest Request) : IRequest<PetMedicalRecordResponse>;
}
