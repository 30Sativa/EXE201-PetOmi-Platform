using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record ApproveClinicCommand(Guid AdminId, Guid ClinicId) : IRequest<ReviewClinicResponse>;
}
