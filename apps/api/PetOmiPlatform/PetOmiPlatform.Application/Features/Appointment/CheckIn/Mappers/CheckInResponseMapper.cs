using PetOmiPlatform.Application.Features.Appointment.CheckIn.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Appointment.CheckIn.Mappers
{
    public static class CheckInResponseMapper
    {
        public static CheckInResponse ToCheckInResponse(this AppointmentDomain appointment)
        {
            return new CheckInResponse
            {
                AppointmentId = appointment.Id,
                Status = appointment.Status.ToString(),
                CheckedInAt = appointment.CheckedInAt,
                CheckedInByUserId = appointment.CheckedInByUserId
            };
        }
    }
}
