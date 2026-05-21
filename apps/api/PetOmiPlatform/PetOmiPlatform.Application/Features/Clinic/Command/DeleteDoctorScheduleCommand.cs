using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record DeleteDoctorScheduleCommand(Guid UserId, Guid ClinicId, Guid ScheduleId)
        : IRequest<Unit>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "DeleteDoctorSchedule";
        string IAuditableCommand.Category => "Clinic";
    }
}
