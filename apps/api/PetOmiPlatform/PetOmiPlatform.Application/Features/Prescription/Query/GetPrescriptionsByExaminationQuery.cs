using MediatR;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Prescription.Query
{
    public record GetPrescriptionsByExaminationQuery(
        Guid ClinicId,
        Guid ExaminationId
    ) : IRequest<IEnumerable<PrescriptionItemResponse>>;
}
