using System;

namespace PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Response
{
    public class ReminderPreferenceResponse
    {
        public Guid PreferenceId { get; set; }
        public Guid UserId { get; set; }
        public string ReminderType { get; set; } = null!;
        public bool IsEnabled { get; set; }
        public int? RemindBeforeMinutes { get; set; }
        public string Channel { get; set; } = "PushEmail";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
