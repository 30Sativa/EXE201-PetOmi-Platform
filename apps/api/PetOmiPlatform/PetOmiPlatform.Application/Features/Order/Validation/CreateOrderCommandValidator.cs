using FluentValidation;
using PetOmiPlatform.Application.Features.Order.Command;

namespace PetOmiPlatform.Application.Features.Order.Validation
{
    public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
    {
        public CreateOrderCommandValidator()
        {
            RuleFor(x => x.Payload.ClinicId)
                .NotEmpty().WithMessage("ClinicId khong duoc de trong.");

            RuleFor(x => x.Payload.OrderType)
                .NotEmpty().WithMessage("OrderType khong duoc de trong.")
                .MaximumLength(30);

            RuleFor(x => x.Payload.Notes)
                .MaximumLength(500)
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.Notes));

            RuleFor(x => x.Payload.Items)
                .NotEmpty().WithMessage("Don hang phai co it nhat 1 mat hang.");

            RuleForEach(x => x.Payload.Items).ChildRules(item =>
            {
                item.RuleFor(x => x.InventoryItemId)
                    .NotEmpty().WithMessage("InventoryItemId khong duoc de trong.");
                item.RuleFor(x => x.Quantity)
                    .GreaterThan(0).WithMessage("So luong phai lon hon 0.");
                item.RuleFor(x => x.UnitPrice)
                    .GreaterThanOrEqualTo(0)
                    .When(x => x.UnitPrice.HasValue)
                    .WithMessage("Don gia khong duoc am.");
                item.RuleFor(x => x.Description)
                    .MaximumLength(300)
                    .When(x => !string.IsNullOrWhiteSpace(x.Description));
            });
        }
    }
}
