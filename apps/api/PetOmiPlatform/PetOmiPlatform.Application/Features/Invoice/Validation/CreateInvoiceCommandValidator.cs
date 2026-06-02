using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class CreateInvoiceCommandValidator : AbstractValidator<CreateInvoiceCommand>
    {
        public CreateInvoiceCommandValidator()
        {
            RuleFor(x => x.Payload)
                .Must(x => x.AppointmentId.HasValue || x.OrderId.HasValue)
                .WithMessage("Hoa don phai co AppointmentId, OrderId hoac ca hai.");

            RuleFor(x => x.Payload.TotalAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Tong tien khong duoc am.");

            RuleFor(x => x.Payload.DiscountAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Giam gia khong duoc am.")
                .Must((req, discount) => discount <= req.Payload.TotalAmount)
                .WithMessage("Giam gia khong duoc lon hon tong tien.");

            RuleFor(x => x.Payload.Items)
                .NotEmpty().WithMessage("Hoa don phai co it nhat 1 dong chi tiet.");

            RuleForEach(x => x.Payload.Items).ChildRules(items =>
            {
                items.RuleFor(i => i.Description).NotEmpty().WithMessage("Mo ta khong duoc de trong.");
                items.RuleFor(i => i.Quantity).GreaterThan(0).WithMessage("So luong phai lon hon 0.");
                items.RuleFor(i => i.UnitPrice).GreaterThanOrEqualTo(0).WithMessage("Don gia khong duoc am.");
            });
        }
    }
}
