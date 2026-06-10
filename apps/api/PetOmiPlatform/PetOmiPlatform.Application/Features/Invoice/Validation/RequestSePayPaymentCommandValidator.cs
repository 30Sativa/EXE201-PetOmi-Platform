using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class RequestSePayPaymentCommandValidator : AbstractValidator<RequestSePayPaymentCommand>
    {
        public RequestSePayPaymentCommandValidator()
        {
            RuleFor(x => x.InvoiceId)
                .NotEmpty().WithMessage("Invoice ID không được để trống.");

            RuleFor(x => x.Payload.PaymentReference)
                .MaximumLength(100)
                .WithMessage("Payment reference tối đa 100 ký tự.")
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.PaymentReference));
        }
    }
}
