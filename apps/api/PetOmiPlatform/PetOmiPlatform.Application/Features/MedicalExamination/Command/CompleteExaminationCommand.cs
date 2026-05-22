using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Command
{
    public record CompleteExaminationCommand(
        Guid ClinicId,
        Guid VetUserId,
        Guid ExaminationId
    ) : IRequest<ExaminationResponse>, IAuditableCommand
    {
        public Guid? UserId => VetUserId;
        public string Action => "CompleteExamination";
        public string Category => "MedicalExamination";
    }
}
