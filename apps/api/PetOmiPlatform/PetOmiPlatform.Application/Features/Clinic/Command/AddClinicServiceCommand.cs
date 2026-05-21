using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record AddClinicServiceCommand(Guid UserId, Guid ClinicId, AddClinicServiceRequest Request)
        : IRequest<ClinicServiceResponse>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "AddClinicService";
        string IAuditableCommand.Category => "Clinic";
    }
}
