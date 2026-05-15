using FluentValidation;
using PetOmiPlatform.Application.Features.Clinic.Command;

namespace PetOmiPlatform.Application.Features.Clinic.Validation
{
    public class RejectClinicCommandValidator : AbstractValidator<RejectClinicCommand>
    {
        public RejectClinicCommandValidator()
        {
            RuleFor(x => x.AdminId)
                .NotEmpty().WithMessage("Admin không được để trống");

            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("ClinicId không được để trống");

            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("Lý do từ chối không được để trống")
                .MaximumLength(500).WithMessage("Lý do từ chối không được vượt quá 500 ký tự");
        }
    }
}
