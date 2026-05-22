using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class ReminderPreferenceMapper
    {
        public static ReminderPreferenceDomain ToDomain(this ReminderPreference entity)
        {
            var reminderType = Enum.TryParse<ReminderType>(entity.ReminderType, true, out var parsed)
                ? parsed
                : ReminderType.Custom;

            return ReminderPreferenceDomain.Reconstitute(
                id: entity.PreferenceId,
                userId: entity.UserId,
                reminderType: reminderType,
                isEnabled: entity.IsEnabled,
                remindBeforeMinutes: entity.RemindBeforeMinutes,
                channel: entity.Channel,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        public static ReminderPreference ToEntity(this ReminderPreferenceDomain domain)
        {
            return new ReminderPreference
            {
                PreferenceId = domain.Id,
                UserId = domain.UserId,
                ReminderType = domain.ReminderType.ToString(),
                IsEnabled = domain.IsEnabled,
                RemindBeforeMinutes = domain.RemindBeforeMinutes,
                Channel = domain.Channel,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
