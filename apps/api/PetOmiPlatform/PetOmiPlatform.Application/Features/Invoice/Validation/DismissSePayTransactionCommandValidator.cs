using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class DismissSePayTransactionCommandValidator : AbstractValidator<DismissSePayTransactionCommand>
    {
        public DismissSePayTransactionCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID khong duoc de trong.");

            RuleFor(x => x.PaymentTransactionId)
                .NotEmpty().WithMessage("Payment transaction ID khong duoc de trong.");

            RuleFor(x => x.ReviewNote)
                .NotEmpty().WithMessage("Review note khong duoc de trong.")
                .MaximumLength(500).WithMessage("Review note toi da 500 ky tu.");
        }
    }
}
