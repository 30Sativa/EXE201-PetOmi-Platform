using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class ManualMatchSePayTransactionCommandValidator : AbstractValidator<ManualMatchSePayTransactionCommand>
    {
        public ManualMatchSePayTransactionCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID khong duoc de trong.");

            RuleFor(x => x.PaymentTransactionId)
                .NotEmpty().WithMessage("Payment transaction ID khong duoc de trong.");

            RuleFor(x => x.InvoiceId)
                .NotEmpty().WithMessage("Invoice ID khong duoc de trong.");

            RuleFor(x => x.ReviewNote)
                .MaximumLength(500)
                .WithMessage("Review note toi da 500 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.ReviewNote));
        }
    }
}
