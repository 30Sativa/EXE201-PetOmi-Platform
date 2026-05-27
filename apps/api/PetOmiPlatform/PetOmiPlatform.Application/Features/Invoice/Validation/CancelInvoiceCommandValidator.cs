using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class CancelInvoiceCommandValidator : AbstractValidator<CancelInvoiceCommand>
    {
        public CancelInvoiceCommandValidator()
        {
            RuleFor(x => x.InvoiceId)
                .NotEmpty().WithMessage("Invoice ID khong duoc de trong.");

            RuleFor(x => x.CancelReason)
                .MaximumLength(500)
                .WithMessage("Ly do huy khong duoc vuot qua 500 ky tu.");
        }
    }
}
