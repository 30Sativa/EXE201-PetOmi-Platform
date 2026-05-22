using FluentValidation;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Reminder.Validation
{
    public class CreateReminderRequestValidator : AbstractValidator<CreateReminderRequest>
    {
        private static readonly string[] ValidReminderTypes =
        {
            "Vaccine", "Medication", "FollowUp",
            "Deworming", "Grooming", "WeightTracking", "Custom"
        };

        public CreateReminderRequestValidator()
        {
            RuleFor(x => x.ReminderType)
                .NotEmpty().WithMessage("Loại reminder không được để trống.")
                .Must(x => ValidReminderTypes.Contains(x, StringComparer.OrdinalIgnoreCase))
                .WithMessage("ReminderType chỉ chấp nhận: Vaccine, Medication, FollowUp, Deworming, Grooming, WeightTracking, Custom.");

            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Tiêu đề reminder không được để trống.")
                .MaximumLength(200).WithMessage("Tiêu đề tối đa 200 ký tự.");

            RuleFor(x => x.RemindAt)
                .NotEmpty().WithMessage("Thời điểm nhắc không được để trống.")
                .Must(x => x > DateTime.UtcNow)
                .WithMessage("Thời điểm nhắc phải lớn hơn thời gian hiện tại.");

            RuleFor(x => x.Message)
                .MaximumLength(1000).WithMessage("Nội dung tối đa 1000 ký tự.")
                .When(x => !string.IsNullOrEmpty(x.Message));
        }
    }
}
