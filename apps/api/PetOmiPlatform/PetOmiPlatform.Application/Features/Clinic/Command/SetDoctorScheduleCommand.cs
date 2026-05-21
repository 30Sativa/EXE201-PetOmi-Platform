using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record SetDoctorScheduleCommand(Guid UserId, Guid ClinicId, Guid VetClinicId, SetDoctorScheduleRequest Request)
        : IRequest<DoctorScheduleResponse>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "SetDoctorSchedule";
        string IAuditableCommand.Category => "Clinic";
    }
}
