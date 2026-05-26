using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class HandleSePayWebhookCommandValidator : AbstractValidator<HandleSePayWebhookCommand>
    {
        public HandleSePayWebhookCommandValidator()
        {
            RuleFor(x => x.Payload.Id)
                .GreaterThan(0).WithMessage("Webhook transaction ID khong hop le.");

            RuleFor(x => x.Payload.AccountNumber)
                .NotEmpty().WithMessage("Webhook account number khong hop le.");

            RuleFor(x => x.Payload.Content)
                .NotEmpty().WithMessage("Webhook transfer content khong hop le.");

            RuleFor(x => x.Payload.TransferType)
                .Must(value => value == "in" || value == "out")
                .WithMessage("Transfer type phai la 'in' hoac 'out'.");

            RuleFor(x => x.Payload.TransferAmount)
                .GreaterThan(0).WithMessage("Transfer amount phai lon hon 0.");
        }
    }
}
