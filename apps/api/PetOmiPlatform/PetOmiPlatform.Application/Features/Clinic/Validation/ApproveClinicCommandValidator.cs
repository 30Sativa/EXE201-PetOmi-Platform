using FluentValidation;
using PetOmiPlatform.Application.Features.Clinic.Command;

namespace PetOmiPlatform.Application.Features.Clinic.Validation
{
    public class ApproveClinicCommandValidator : AbstractValidator<ApproveClinicCommand>
    {
        public ApproveClinicCommandValidator()
        {
            RuleFor(x => x.AdminId)
                .NotEmpty().WithMessage("Admin không được để trống");

            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("ClinicId không được để trống");
        }
    }
}
