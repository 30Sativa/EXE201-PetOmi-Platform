using PetOmiPlatform.Domain.Common;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class SystemSettingDomain : BaseEntity
    {
        public string SettingKey { get; private set; }
        public string SettingValue { get; private set; }
        public string Category { get; private set; }
        public string? Description { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }

        private SystemSettingDomain() { }

        public static SystemSettingDomain Create(
            string settingKey,
            string settingValue,
            string category,
            string? description = null)
        {
            return new SystemSettingDomain
            {
                Id = Guid.NewGuid(),
                SettingKey = settingKey,
                SettingValue = settingValue,
                Category = category,
                Description = description,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
        }

        public static SystemSettingDomain Reconstitute(
            Guid id,
            string settingKey,
            string settingValue,
            string category,
            string? description,
            DateTime createdAt,
            DateTime updatedAt)
        {
            return new SystemSettingDomain
            {
                Id = id,
                SettingKey = settingKey,
                SettingValue = settingValue,
                Category = category,
                Description = description,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt,
            };
        }

        public void UpdateValue(string newValue)
        {
            SettingValue = newValue;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
