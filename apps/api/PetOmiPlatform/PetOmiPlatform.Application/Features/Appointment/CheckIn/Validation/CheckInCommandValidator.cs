using FluentValidation;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.Command;

namespace PetOmiPlatform.Application.Features.Appointment.CheckIn.Validation
{
    public class CheckInCommandValidator : AbstractValidator<CheckInCommand>
    {
        public CheckInCommandValidator()
        {
            RuleFor(x => x.AppointmentId)
                .NotEmpty().WithMessage("Appointment ID không được để trống.");

            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID không được để trống.");

            RuleFor(x => x.StaffUserId)
                .NotEmpty().WithMessage("Staff User ID không được để trống.");
        }
    }
}
