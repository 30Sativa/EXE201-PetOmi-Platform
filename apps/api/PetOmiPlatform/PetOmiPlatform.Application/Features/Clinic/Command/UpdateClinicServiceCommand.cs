using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record UpdateClinicServiceCommand(Guid UserId, Guid ClinicId, Guid ServiceId, UpdateClinicServiceRequest Request)
        : IRequest<ClinicServiceResponse>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "UpdateClinicService";
        string IAuditableCommand.Category => "Clinic";
    }
}
