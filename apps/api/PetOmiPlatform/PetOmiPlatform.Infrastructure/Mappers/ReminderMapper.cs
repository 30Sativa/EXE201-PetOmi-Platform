using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class ReminderMapper
    {
        public static ReminderDomain ToDomain(this Reminder entity)
        {
            var reminderType = Enum.TryParse<ReminderType>(entity.ReminderType, true, out var rt)
                ? rt
                : ReminderType.Custom;

            var sourceType = Enum.TryParse<ReminderSourceType>(entity.SourceType, true, out var st)
                ? st
                : ReminderSourceType.System;

            var status = Enum.TryParse<ReminderStatus>(entity.Status, true, out var s)
                ? s
                : ReminderStatus.Pending;

            return ReminderDomain.Reconstitute(
                id: entity.ReminderId,
                userId: entity.UserId,
                petId: entity.PetId,
                reminderType: reminderType,
                entityType: entity.EntityType,
                entityId: entity.EntityId,
                sourceType: sourceType,
                createdByUserId: entity.CreatedByUserId,
                title: entity.Title,
                message: entity.Message,
                remindAt: entity.RemindAt,
                status: status,
                isEnabled: entity.IsEnabled,
                repeatRule: entity.RepeatRule,
                repeatUntil: entity.RepeatUntil,
                sentAt: entity.SentAt,
                dismissedAt: entity.DismissedAt,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        public static Reminder ToEntity(this ReminderDomain domain)
        {
            return new Reminder
            {
                ReminderId = domain.Id,
                UserId = domain.UserId,
                PetId = domain.PetId,
                ReminderType = domain.ReminderType.ToString(),
                EntityType = domain.EntityType,
                EntityId = domain.EntityId,
                SourceType = domain.SourceType.ToString(),
                CreatedByUserId = domain.CreatedByUserId,
                Title = domain.Title,
                Message = domain.Message,
                RemindAt = domain.RemindAt,
                Status = domain.Status.ToString(),
                IsEnabled = domain.IsEnabled,
                SentAt = domain.SentAt,
                DismissedAt = domain.DismissedAt,
                RepeatRule = domain.RepeatRule,
                RepeatUntil = domain.RepeatUntil,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
