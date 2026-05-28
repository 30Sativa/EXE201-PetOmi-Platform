using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Admin.Commands;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public class UpdateSettingCommandHandler : IRequestHandler<UpdateSettingCommand, SystemSettingResponse>
{
    private readonly ISystemSettingRepository _settingRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateSettingCommandHandler(
        ISystemSettingRepository settingRepository,
        IUnitOfWork unitOfWork)
    {
        _settingRepository = settingRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<SystemSettingResponse> Handle(
        UpdateSettingCommand command,
        CancellationToken cancellationToken)
    {
        var existing = await _settingRepository.GetByKeyAsync(command.Key);
        if (existing == null)
            throw new NotFoundException($"Setting '{command.Key}' not found.");

        existing.UpdateValue(command.Value);
        await _settingRepository.UpsertAsync(existing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new SystemSettingResponse
        {
            SettingKey = existing.SettingKey,
            SettingValue = existing.SettingValue,
            Category = existing.Category,
            Description = existing.Description,
            UpdatedAt = existing.UpdatedAt.ToString("o"),
        };
    }
}
