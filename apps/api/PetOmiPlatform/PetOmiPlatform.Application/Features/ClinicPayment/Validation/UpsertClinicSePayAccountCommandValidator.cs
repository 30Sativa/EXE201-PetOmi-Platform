using FluentValidation;
using PetOmiPlatform.Application.Features.ClinicPayment.Command;

namespace PetOmiPlatform.Application.Features.ClinicPayment.Validation
{
    public class UpsertClinicSePayAccountCommandValidator : AbstractValidator<UpsertClinicSePayAccountCommand>
    {
        public UpsertClinicSePayAccountCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID không được để trống.");

            RuleFor(x => x.Payload.BankCode)
                .NotEmpty().WithMessage("Bank code không được để trống.")
                .MaximumLength(30).WithMessage("Bank code tối đa 30 ký tự.");

            RuleFor(x => x.Payload.AccountNumber)
                .NotEmpty().WithMessage("Account number không được để trống.")
                .MaximumLength(50).WithMessage("Account number tối đa 50 ký tự.");

            RuleFor(x => x.Payload.BankName)
                .MaximumLength(100).WithMessage("Bank name tối đa 100 ký tự.")
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.BankName));

            RuleFor(x => x.Payload.AccountName)
                .MaximumLength(200).WithMessage("Account name tối đa 200 ký tự.")
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.AccountName));
        }
    }
}
