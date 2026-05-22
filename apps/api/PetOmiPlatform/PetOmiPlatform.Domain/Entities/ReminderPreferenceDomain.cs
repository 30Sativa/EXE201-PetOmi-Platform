using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class ReminderPreferenceDomain : BaseEntity
    {
        public Guid UserId { get; private set; }
        public ReminderType ReminderType { get; private set; }
        public bool IsEnabled { get; private set; }
        public int? RemindBeforeMinutes { get; private set; }
        public string Channel { get; private set; } = "PushEmail";
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private ReminderPreferenceDomain() { }

        public static ReminderPreferenceDomain Create(
            Guid userId,
            ReminderType reminderType,
            bool isEnabled = true,
            int? remindBeforeMinutes = null,
            string channel = "PushEmail")
        {
            return new ReminderPreferenceDomain
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ReminderType = reminderType,
                IsEnabled = isEnabled,
                RemindBeforeMinutes = remindBeforeMinutes,
                Channel = channel,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static ReminderPreferenceDomain Reconstitute(
            Guid id,
            Guid userId,
            ReminderType reminderType,
            bool isEnabled,
            int? remindBeforeMinutes,
            string channel,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            return new ReminderPreferenceDomain
            {
                Id = id,
                UserId = userId,
                ReminderType = reminderType,
                IsEnabled = isEnabled,
                RemindBeforeMinutes = remindBeforeMinutes,
                Channel = channel,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt ?? DateTime.UtcNow
            };
        }

        public void Update(bool? isEnabled = null, int? remindBeforeMinutes = null, string channel = null)
        {
            if (isEnabled.HasValue)
                IsEnabled = isEnabled.Value;

            if (remindBeforeMinutes.HasValue && remindBeforeMinutes.Value > 0)
                RemindBeforeMinutes = remindBeforeMinutes.Value;

            if (!string.IsNullOrWhiteSpace(channel))
                Channel = channel;

            UpdatedAt = DateTime.UtcNow;
        }
    }
}
