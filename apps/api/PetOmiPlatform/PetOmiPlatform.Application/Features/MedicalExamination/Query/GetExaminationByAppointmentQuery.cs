using MediatR;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Query
{
    public record GetExaminationByAppointmentQuery(
        Guid AppointmentId,
        Guid UserId
    ) : IRequest<ExaminationResponse?>;
}
