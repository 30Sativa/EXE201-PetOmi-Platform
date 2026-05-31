using FluentValidation;
using PetOmiPlatform.Application.Features.Clinic.Command;

namespace PetOmiPlatform.Application.Features.Clinic.Validation
{
    public class DeactivateClinicStaffCommandValidator : AbstractValidator<DeactivateClinicStaffCommand>
    {
        public DeactivateClinicStaffCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("ClinicId khong duoc de trong.");

            RuleFor(x => x.VetClinicId)
                .NotEmpty().WithMessage("VetClinicId khong duoc de trong.");

            RuleFor(x => x.Request.Reason)
                .NotEmpty().WithMessage("Reason khong duoc de trong.")
                .MaximumLength(500).WithMessage("Reason toi da 500 ky tu.");
        }
    }
}
