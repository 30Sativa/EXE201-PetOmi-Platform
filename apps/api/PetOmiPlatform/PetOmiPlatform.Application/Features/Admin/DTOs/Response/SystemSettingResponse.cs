namespace PetOmiPlatform.Application.Features.Admin.DTOs.Response;

public class SystemSettingResponse
{
    public string SettingKey { get; set; } = null!;
    public string SettingValue { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string? Description { get; set; }
    public string UpdatedAt { get; set; } = null!;
}
