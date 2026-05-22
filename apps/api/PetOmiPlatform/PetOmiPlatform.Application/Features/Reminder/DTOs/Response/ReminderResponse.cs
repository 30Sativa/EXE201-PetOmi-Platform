using System;

namespace PetOmiPlatform.Application.Features.Reminder.DTOs.Response
{
    public class ReminderResponse
    {
        public Guid ReminderId { get; set; }
        public Guid UserId { get; set; }
        public Guid? PetId { get; set; }
        public string ReminderType { get; set; } = null!;
        public string? EntityType { get; set; }
        public Guid? EntityId { get; set; }
        public string SourceType { get; set; } = null!;
        public Guid? CreatedByUserId { get; set; }
        public string Title { get; set; } = null!;
        public string? Message { get; set; }
        public DateTime RemindAt { get; set; }
        public string Status { get; set; } = null!;
        public bool IsEnabled { get; set; }
        public string? RepeatRule { get; set; }
        public DateTime? RepeatUntil { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? DismissedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
