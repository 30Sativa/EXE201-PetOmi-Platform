using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Request;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Command
{
    public record UpdateExaminationCommand(
        Guid ClinicId,
        Guid ExaminationId,
        UpdateExaminationRequest Payload
    ) : IRequest<ExaminationResponse>, IAuditableCommand
    {
        public Guid? UserId => null; // Assuming staff/vet, could add if needed
        public string Action => "UpdateExamination";
        public string Category => "MedicalExamination";
    }
}
