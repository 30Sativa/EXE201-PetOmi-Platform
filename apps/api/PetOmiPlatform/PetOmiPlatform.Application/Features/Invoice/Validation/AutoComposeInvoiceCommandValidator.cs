using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Command;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class AutoComposeInvoiceCommandValidator : AbstractValidator<AutoComposeInvoiceCommand>
    {
        public AutoComposeInvoiceCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID khong duoc de trong.");

            RuleFor(x => x.Payload.AppointmentId)
                .NotEmpty().WithMessage("Appointment ID khong duoc de trong.");

            RuleFor(x => x.Payload.DiscountAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Discount khong duoc am.");

            RuleFor(x => x.Payload.Notes)
                .MaximumLength(500).WithMessage("Notes toi da 500 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.Payload.Notes));

            RuleFor(x => x.Payload)
                .Must(x => x.IncludeService || x.IncludePrescriptions)
                .WithMessage("Phai bat it nhat 1 nguon tao dong hoa don (service hoac prescriptions).");
        }
    }
}
