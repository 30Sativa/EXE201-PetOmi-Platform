using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record UpdateClinicStaffRoleCommand(
        Guid RequestingUserId,
        Guid ClinicId,
        Guid VetClinicId,
        UpdateClinicStaffRoleRequest Request) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => RequestingUserId;
        public string Action => "UpdateClinicStaffRole";
        public string Category => "ClinicStaff";
    }
}
