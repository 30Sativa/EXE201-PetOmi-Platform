using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public class SystemSetting
{
    public Guid SettingId { get; set; }
    public string SettingKey { get; set; } = null!;
    public string SettingValue { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
