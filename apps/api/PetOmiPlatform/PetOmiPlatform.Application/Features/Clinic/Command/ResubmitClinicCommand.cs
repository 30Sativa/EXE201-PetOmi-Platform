using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    /// <summary>ClinicOwner re-apply sau khi bị Reject — reset về Pending.</summary>
    public record ResubmitClinicCommand(Guid UserId, Guid ClinicId, ResubmitClinicRequest Request)
        : IRequest<GetMyClinicResponse>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "ResubmitClinic";
        string IAuditableCommand.Category => "Clinic";
    }
}
