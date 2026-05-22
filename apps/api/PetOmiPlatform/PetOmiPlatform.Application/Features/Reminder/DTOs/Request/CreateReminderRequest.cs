namespace PetOmiPlatform.Application.Features.Reminder.DTOs.Request
{
    public class CreateReminderRequest
    {
        public string ReminderType { get; set; } = null!;
        public Guid? PetId { get; set; }
        public string? EntityType { get; set; }
        public Guid? EntityId { get; set; }
        public string? SourceType { get; set; }
        public string Title { get; set; } = null!;
        public string? Message { get; set; }
        public DateTime RemindAt { get; set; }
        public string? RepeatRule { get; set; }
        public DateTime? RepeatUntil { get; set; }
    }
}
