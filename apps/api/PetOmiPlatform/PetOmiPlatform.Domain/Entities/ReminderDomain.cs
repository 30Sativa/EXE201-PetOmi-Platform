using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class ReminderDomain : BaseEntity
    {
        public Guid UserId { get; private set; }
        public Guid? PetId { get; private set; }

        public ReminderType ReminderType { get; private set; }

        public string? EntityType { get; private set; }
        public Guid? EntityId { get; private set; }

        public ReminderSourceType SourceType { get; private set; }
        public Guid? CreatedByUserId { get; private set; }

        public string Title { get; private set; }
        public string? Message { get; private set; }

        public DateTime RemindAt { get; private set; }
        public ReminderStatus Status { get; private set; }
        public bool IsEnabled { get; private set; }

        public DateTime? SentAt { get; private set; }
        public DateTime? DismissedAt { get; private set; }

        public string? RepeatRule { get; private set; }
        public DateTime? RepeatUntil { get; private set; }

        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private ReminderDomain() { }

        public static ReminderDomain Create(
            Guid userId,
            Guid? petId,
            ReminderType reminderType,
            string? entityType,
            Guid? entityId,
            ReminderSourceType sourceType,
            Guid? createdByUserId,
            string title,
            string? message,
            DateTime remindAt,
            string? repeatRule = null,
            DateTime? repeatUntil = null)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new DomainException("Tiêu đề reminder không được để trống.");

            if (remindAt <= DateTime.UtcNow)
                throw new DomainException("Thời điểm nhắc phải lớn hơn thời gian hiện tại.");

            return new ReminderDomain
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PetId = petId,
                ReminderType = reminderType,
                EntityType = entityType,
                EntityId = entityId,
                SourceType = sourceType,
                CreatedByUserId = createdByUserId,
                Title = title,
                Message = message,
                RemindAt = remindAt,
                Status = ReminderStatus.Pending,
                IsEnabled = true,
                RepeatRule = repeatRule,
                RepeatUntil = repeatUntil,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static ReminderDomain Reconstitute(
            Guid id,
            Guid userId,
            Guid? petId,
            ReminderType reminderType,
            string? entityType,
            Guid? entityId,
            ReminderSourceType sourceType,
            Guid? createdByUserId,
            string title,
            string? message,
            DateTime remindAt,
            ReminderStatus status,
            bool isEnabled,
            string? repeatRule,
            DateTime? repeatUntil,
            DateTime? sentAt,
            DateTime? dismissedAt,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            return new ReminderDomain
            {
                Id = id,
                UserId = userId,
                PetId = petId,
                ReminderType = reminderType,
                EntityType = entityType,
                EntityId = entityId,
                SourceType = sourceType,
                CreatedByUserId = createdByUserId,
                Title = title,
                Message = message,
                RemindAt = remindAt,
                Status = status,
                IsEnabled = isEnabled,
                RepeatRule = repeatRule,
                RepeatUntil = repeatUntil,
                SentAt = sentAt,
                DismissedAt = dismissedAt,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        public void MarkAsSent()
        {
            if (Status == ReminderStatus.Sent)
                throw new DomainException("Reminder này đã được gửi trước đó.");

            Status = ReminderStatus.Sent;
            SentAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void ToggleEnabled()
        {
            IsEnabled = !IsEnabled;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Dismiss()
        {
            if (Status == ReminderStatus.Dismissed)
                throw new DomainException("Reminder này đã bị bỏ qua trước đó.");

            Status = ReminderStatus.Dismissed;
            DismissedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Cancel()
        {
            if (Status == ReminderStatus.Cancelled)
                throw new DomainException("Reminder này đã bị hủy trước đó.");

            Status = ReminderStatus.Cancelled;
            UpdatedAt = DateTime.UtcNow;
        }

        public bool ShouldSend()
            => IsEnabled
            && Status == ReminderStatus.Pending
            && RemindAt <= DateTime.UtcNow;

        public T? ParseRepeatRule<T>() where T : class
        {
            if (string.IsNullOrWhiteSpace(RepeatRule))
                return null;

            return System.Text.Json.JsonSerializer.Deserialize<T>(RepeatRule);
        }

        public static string SerializeRepeatRule<T>(T rule)
        {
            return System.Text.Json.JsonSerializer.Serialize(rule);
        }
    }
}
