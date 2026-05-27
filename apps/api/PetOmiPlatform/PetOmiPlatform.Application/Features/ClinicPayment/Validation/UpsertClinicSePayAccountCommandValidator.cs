using FluentValidation;
using PetOmiPlatform.Application.Features.ClinicPayment.Command;

namespace PetOmiPlatform.Application.Features.ClinicPayment.Validation
{
    public class UpsertClinicSePayAccountCommandValidator : AbstractValidator<UpsertClinicSePayAccountCommand>
    {
        public UpsertClinicSePayAccountCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID khong duoc de trong.");

            RuleFor(x => x.Payload.BankCode)
                .NotEmpty().WithMessage("Bank code khong duoc de trong.")
                .MaximumLength(30).WithMessage("Bank code toi da 30 ky tu.");

            RuleFor(x => x.Payload.AccountNumber)
                .NotEmpty().WithMessage("Account number khong duoc de trong.")
                .MaximumLength(50).WithMessage("Account number toi da 50 ky tu.");

            RuleFor(x => x.Payload.BankName)
                .MaximumLength(100).WithMessage("Bank name toi da 100 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.BankName));

            RuleFor(x => x.Payload.AccountName)
                .MaximumLength(200).WithMessage("Account name toi da 200 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.AccountName));
        }
    }
}
