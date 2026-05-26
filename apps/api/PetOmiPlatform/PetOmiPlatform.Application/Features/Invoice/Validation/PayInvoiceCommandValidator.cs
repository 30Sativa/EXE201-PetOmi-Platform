using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Domain.Common.Enums;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class PayInvoiceCommandValidator : AbstractValidator<PayInvoiceCommand>
    {
        public PayInvoiceCommandValidator()
        {
            RuleFor(x => x.InvoiceId)
                .NotEmpty().WithMessage("Invoice ID khong duoc de trong.");

            RuleFor(x => x.Payload.PaymentMethod)
                .NotEmpty().WithMessage("Payment method khong duoc de trong.")
                .Must(value => Enum.TryParse<PaymentMethod>(value, true, out _))
                .WithMessage("Payment method khong hop le.");
        }
    }
}
