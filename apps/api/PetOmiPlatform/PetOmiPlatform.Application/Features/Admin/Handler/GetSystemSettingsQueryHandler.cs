using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Features.Admin.Queries;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public class GetSystemSettingsQueryHandler : IRequestHandler<GetSystemSettingsQuery, List<SystemSettingResponse>>
{
    private readonly ISystemSettingRepository _settingRepository;

    public GetSystemSettingsQueryHandler(ISystemSettingRepository settingRepository)
    {
        _settingRepository = settingRepository;
    }

    public async Task<List<SystemSettingResponse>> Handle(
        GetSystemSettingsQuery request,
        CancellationToken cancellationToken)
    {
        var settings = await _settingRepository.GetAllAsync();

        return settings.Select(s => new SystemSettingResponse
        {
            SettingKey = s.SettingKey,
            SettingValue = s.SettingValue,
            Category = s.Category,
            Description = s.Description,
            UpdatedAt = s.UpdatedAt.ToString("o"),
        }).ToList();
    }
}
