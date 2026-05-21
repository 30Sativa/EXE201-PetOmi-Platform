using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    /// <summary>Public profile — Owner app dùng để hiển thị PK cho user, kèm danh sách dịch vụ.</summary>
    public record GetClinicPublicQuery(Guid ClinicId) : IRequest<ClinicPublicResponse>;
}
