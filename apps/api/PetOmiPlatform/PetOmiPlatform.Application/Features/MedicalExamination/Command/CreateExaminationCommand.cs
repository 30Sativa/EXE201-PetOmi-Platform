using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Request;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Command
{
    public record CreateExaminationCommand(
        Guid ClinicId,
        Guid VetUserId,
        CreateExaminationRequest Payload
    ) : IRequest<ExaminationResponse>, IAuditableCommand
    {
        public Guid? UserId => VetUserId;
        public string Action => "CreateExamination";
        public string Category => "MedicalExamination";
    }
}
