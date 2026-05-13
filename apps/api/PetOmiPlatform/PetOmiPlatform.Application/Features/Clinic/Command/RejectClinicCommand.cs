using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record RejectClinicCommand(Guid AdminId, Guid ClinicId, RejectClinicRequest Request) : IRequest<ReviewClinicResponse>;
}
