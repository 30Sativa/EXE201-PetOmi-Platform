using FluentValidation;
using PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Request;

namespace PetOmiPlatform.Application.Features.ReminderPreference.Validation
{
    public class UpdateReminderPreferenceRequestValidator : AbstractValidator<UpdateReminderPreferenceRequest>
    {
        private static readonly string[] ValidReminderTypes =
        {
            "Vaccine", "Medication", "FollowUp",
            "Deworming", "Grooming", "WeightTracking", "Custom"
        };

        private static readonly string[] ValidChannels =
        {
            "Push", "Email", "PushEmail", "PushEmailSMS"
        };

        public UpdateReminderPreferenceRequestValidator()
        {
            RuleFor(x => x.ReminderType)
                .NotEmpty().WithMessage("Loại reminder không được để trống.")
                .Must(x => ValidReminderTypes.Contains(x, StringComparer.OrdinalIgnoreCase))
                .WithMessage("ReminderType chỉ chấp nhận: Vaccine, Medication, FollowUp, Deworming, Grooming, WeightTracking, Custom.");

            RuleFor(x => x.RemindBeforeMinutes)
                .GreaterThan(0).WithMessage("Số phút nhắc trước phải lớn hơn 0.")
                .When(x => x.RemindBeforeMinutes.HasValue);

            RuleFor(x => x.Channel)
                .Must(x => string.IsNullOrWhiteSpace(x) || ValidChannels.Contains(x, StringComparer.OrdinalIgnoreCase))
                .WithMessage("Channel chỉ chấp nhận: Push, Email, PushEmail, PushEmailSMS.");
        }
    }
}
