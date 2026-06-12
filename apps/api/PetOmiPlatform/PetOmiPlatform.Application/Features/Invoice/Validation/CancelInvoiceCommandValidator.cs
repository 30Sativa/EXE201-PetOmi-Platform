using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class CancelInvoiceCommandValidator : AbstractValidator<CancelInvoiceCommand>
    {
        public CancelInvoiceCommandValidator()
        {
            RuleFor(x => x.InvoiceId)
                .NotEmpty().WithMessage("Invoice ID không được để trống.");

            RuleFor(x => x.CancelReason)
                .MaximumLength(500)
                .WithMessage("Lý do hủy không được vượt quá 500 ký tự.");
        }
    }
}
