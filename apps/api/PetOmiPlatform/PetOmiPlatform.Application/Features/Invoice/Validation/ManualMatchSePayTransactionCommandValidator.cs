using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class ManualMatchSePayTransactionCommandValidator : AbstractValidator<ManualMatchSePayTransactionCommand>
    {
        public ManualMatchSePayTransactionCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID không được để trống.");

            RuleFor(x => x.PaymentTransactionId)
                .NotEmpty().WithMessage("Payment transaction ID không được để trống.");

            RuleFor(x => x.InvoiceId)
                .NotEmpty().WithMessage("Invoice ID không được để trống.");

            RuleFor(x => x.ReviewNote)
                .MaximumLength(500)
                .WithMessage("Review note tối đa 500 ký tự.")
                .When(x => !string.IsNullOrWhiteSpace(x.ReviewNote));
        }
    }
}
