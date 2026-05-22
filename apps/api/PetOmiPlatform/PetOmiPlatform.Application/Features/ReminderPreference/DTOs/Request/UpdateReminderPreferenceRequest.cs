namespace PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Request
{
    public class UpdateReminderPreferenceRequest
    {
        public string ReminderType { get; set; } = null!;
        public bool IsEnabled { get; set; } = true;
        public int? RemindBeforeMinutes { get; set; }
        public string? Channel { get; set; } = "PushEmail";
    }
}
