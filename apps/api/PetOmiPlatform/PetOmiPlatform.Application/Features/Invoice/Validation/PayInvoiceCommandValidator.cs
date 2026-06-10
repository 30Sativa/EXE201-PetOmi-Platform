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
                .NotEmpty().WithMessage("Invoice ID không được để trống.");

            RuleFor(x => x.Payload.PaymentMethod)
                .NotEmpty().WithMessage("Payment method không được để trống.")
                .Must(value => Enum.TryParse<PaymentMethod>(value, true, out _))
                .WithMessage("Payment method không hợp lệ.");

            RuleFor(x => x.Payload.PaidAmount)
                .GreaterThan(0)
                .When(x => x.Payload.PaidAmount.HasValue)
                .WithMessage("PaidAmount phai lon hon 0.");
        }
    }
}
