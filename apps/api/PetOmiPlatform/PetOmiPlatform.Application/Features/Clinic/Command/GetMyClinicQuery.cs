using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    /// <summary>Owner query — lấy thông tin clinic mình đang sở hữu.</summary>
    public record GetMyClinicQuery(Guid UserId) : IRequest<GetMyClinicResponse?>;
}
