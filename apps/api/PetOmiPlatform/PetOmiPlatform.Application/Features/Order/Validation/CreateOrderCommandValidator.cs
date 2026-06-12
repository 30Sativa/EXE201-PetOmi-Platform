using FluentValidation;
using PetOmiPlatform.Application.Features.Order.Command;

namespace PetOmiPlatform.Application.Features.Order.Validation
{
    public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
    {
        public CreateOrderCommandValidator()
        {
            RuleFor(x => x.Payload.ClinicId)
                .NotEmpty().WithMessage("ClinicId không được để trống.");

            RuleFor(x => x.Payload.OrderType)
                .NotEmpty().WithMessage("OrderType không được để trống.")
                .MaximumLength(30);

            RuleFor(x => x.Payload.Notes)
                .MaximumLength(500)
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.Notes));

            RuleFor(x => x.Payload.Items)
                .NotEmpty().WithMessage("Đơn hàng phải có ít nhất 1 mặt hàng.");

            RuleForEach(x => x.Payload.Items).ChildRules(item =>
            {
                item.RuleFor(x => x.InventoryItemId)
                    .NotEmpty().WithMessage("InventoryItemId không được để trống.");
                item.RuleFor(x => x.Quantity)
                    .GreaterThan(0).WithMessage("So luong phai lon hon 0.");
                item.RuleFor(x => x.UnitPrice)
                    .GreaterThanOrEqualTo(0)
                    .When(x => x.UnitPrice.HasValue)
                    .WithMessage("Đơn giá không được âm.");
                item.RuleFor(x => x.Description)
                    .MaximumLength(300)
                    .When(x => !string.IsNullOrWhiteSpace(x.Description));
            });
        }
    }
}
