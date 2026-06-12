using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class AutoComposeInvoiceCommandValidator : AbstractValidator<AutoComposeInvoiceCommand>
    {
        public AutoComposeInvoiceCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID không được để trống.");

            RuleFor(x => x.Payload)
                .Must(x => x.AppointmentId.HasValue || x.OrderId.HasValue)
                .WithMessage("Auto-compose cần AppointmentId, OrderId hoặc cả hai.");

            RuleFor(x => x.Payload.DiscountAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Discount không được âm.");

            RuleFor(x => x.Payload.Notes)
                .MaximumLength(500).WithMessage("Notes tối đa 500 ký tự.")
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.Notes));

            RuleFor(x => x.Payload)
                .Must(x => x.IncludeService || x.IncludePrescriptions || x.IncludeOrderItems)
                .WithMessage("Phải bật ít nhất 1 nguồn tạo dòng hóa đơn.");
        }
    }
}
