using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class ConfirmManualRefundCommandValidator : AbstractValidator<ConfirmManualRefundCommand>
    {
        public ConfirmManualRefundCommandValidator()
        {
            RuleFor(x => x.InvoiceId)
                .NotEmpty().WithMessage("Invoice ID khong duoc de trong.");

            RuleFor(x => x.RefundNote)
                .NotEmpty().WithMessage("RefundNote khong duoc de trong.")
                .MaximumLength(500).WithMessage("RefundNote khong duoc vuot qua 500 ky tu.");
        }
    }
}
