using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class CreateInvoiceCommandValidator : AbstractValidator<CreateInvoiceCommand>
    {
        public CreateInvoiceCommandValidator()
        {
            RuleFor(x => x.Payload.AppointmentId)
                .NotEmpty().WithMessage("Appointment ID không được để trống.");

            RuleFor(x => x.Payload.TotalAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Tổng tiền không được âm.");

            RuleFor(x => x.Payload.DiscountAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Giảm giá không được âm.")
                .Must((req, discount) => discount <= req.Payload.TotalAmount)
                .WithMessage("Giảm giá không được lớn hơn tổng tiền.");

            RuleFor(x => x.Payload.Items)
                .NotEmpty().WithMessage("Hóa đơn phải có ít nhất 1 dòng chi tiết.");

            RuleForEach(x => x.Payload.Items).ChildRules(items =>
            {
                items.RuleFor(i => i.Description).NotEmpty().WithMessage("Mô tả không được để trống.");
                items.RuleFor(i => i.Quantity).GreaterThan(0).WithMessage("Số lượng phải lớn hơn 0.");
                items.RuleFor(i => i.UnitPrice).GreaterThanOrEqualTo(0).WithMessage("Đơn giá không được âm.");
            });
        }
    }
}
