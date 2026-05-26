using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class RequestSePayPaymentCommandValidator : AbstractValidator<RequestSePayPaymentCommand>
    {
        public RequestSePayPaymentCommandValidator()
        {
            RuleFor(x => x.InvoiceId)
                .NotEmpty().WithMessage("Invoice ID khong duoc de trong.");

            RuleFor(x => x.Payload.PaymentReference)
                .MaximumLength(100)
                .WithMessage("Payment reference toi da 100 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.PaymentReference));
        }
    }
}
