using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class ConfirmManualRefundCommandValidator : AbstractValidator<ConfirmManualRefundCommand>
    {
        public ConfirmManualRefundCommandValidator()
        {
            RuleFor(x => x.InvoiceId)
                .NotEmpty().WithMessage("Invoice ID không được để trống.");

            RuleFor(x => x.RefundNote)
                .NotEmpty().WithMessage("RefundNote không được để trống.")
                .MaximumLength(500).WithMessage("RefundNote không được vượt quá 500 ký tự.");
        }
    }
}
