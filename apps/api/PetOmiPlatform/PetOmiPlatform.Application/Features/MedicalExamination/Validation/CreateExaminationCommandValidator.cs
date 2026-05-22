using FluentValidation;
using PetOmiPlatform.Application.Features.MedicalExamination.Command;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Validation
{
    public class CreateExaminationCommandValidator : AbstractValidator<CreateExaminationCommand>
    {
        public CreateExaminationCommandValidator()
        {
            RuleFor(x => x.Payload.AppointmentId)
                .NotEmpty().WithMessage("Appointment ID không được để trống.");

            RuleFor(x => x.Payload.ChiefComplaint)
                .NotEmpty().WithMessage("Lý do khám không được để trống.");
        }
    }
}
