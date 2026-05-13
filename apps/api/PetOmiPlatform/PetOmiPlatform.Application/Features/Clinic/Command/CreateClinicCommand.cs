using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record CreateClinicCommand(Guid UserId, CreateClinicRequest Request) : IRequest<CreateClinicResponse>;
}
