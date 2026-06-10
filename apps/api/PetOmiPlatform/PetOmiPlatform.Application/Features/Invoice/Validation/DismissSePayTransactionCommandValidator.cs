using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class DismissSePayTransactionCommandValidator : AbstractValidator<DismissSePayTransactionCommand>
    {
        public DismissSePayTransactionCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID không được để trống.");

            RuleFor(x => x.PaymentTransactionId)
                .NotEmpty().WithMessage("Payment transaction ID không được để trống.");

            RuleFor(x => x.ReviewNote)
                .NotEmpty().WithMessage("Review note không được để trống.")
                .MaximumLength(500).WithMessage("Review note tối đa 500 ký tự.");
        }
    }
}
