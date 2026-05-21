using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record UpdateClinicInfoCommand(Guid UserId, Guid ClinicId, UpdateClinicInfoRequest Request)
        : IRequest<GetMyClinicResponse>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "UpdateClinicInfo";
        string IAuditableCommand.Category => "Clinic";
    }
}
