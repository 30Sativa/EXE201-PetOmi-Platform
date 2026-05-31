using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record DeactivateClinicStaffCommand(
        Guid RequestingUserId,
        Guid ClinicId,
        Guid VetClinicId,
        DeactivateClinicStaffRequest Request) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => RequestingUserId;
        public string Action => "DeactivateClinicStaff";
        public string Category => "ClinicStaff";
    }
}
