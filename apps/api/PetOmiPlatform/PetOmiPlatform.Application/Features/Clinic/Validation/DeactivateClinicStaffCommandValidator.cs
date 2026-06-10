using FluentValidation;
using PetOmiPlatform.Application.Features.Clinic.Command;

namespace PetOmiPlatform.Application.Features.Clinic.Validation
{
    public class DeactivateClinicStaffCommandValidator : AbstractValidator<DeactivateClinicStaffCommand>
    {
        public DeactivateClinicStaffCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("ClinicId không được để trống.");

            RuleFor(x => x.VetClinicId)
                .NotEmpty().WithMessage("VetClinicId không được để trống.");

            RuleFor(x => x.Request.Reason)
                .NotEmpty().WithMessage("Reason không được để trống.")
                .MaximumLength(500).WithMessage("Reason tối đa 500 ký tự.");
        }
    }
}
