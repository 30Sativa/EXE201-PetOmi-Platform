using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Admin.Commands;

public record UpdateSettingCommand(
    Guid AdminId,
    string Key,
    string Value
) : IRequest<SystemSettingResponse>, IAuditableCommand
{
    public Guid? UserId => AdminId;
    public string Action => "UpdateSetting";
    public string Category => "System";
}
