using MediatR;
using PetOmiPlatform.Application.Features.ReminderPreference.Command;
using PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Response;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.ReminderPreference.Handler
{
    public class UpsertReminderPreferenceCommandHandler
        : IRequestHandler<UpsertReminderPreferenceCommand, ReminderPreferenceResponse>
    {
        private readonly IReminderPreferenceRepository _preferenceRepo;
        private readonly IUnitOfWork _unitOfWork;

        public UpsertReminderPreferenceCommandHandler(
            IReminderPreferenceRepository preferenceRepo,
            IUnitOfWork unitOfWork)
        {
            _preferenceRepo = preferenceRepo;
            _unitOfWork = unitOfWork;
        }

        public async Task<ReminderPreferenceResponse> Handle(
            UpsertReminderPreferenceCommand command, CancellationToken ct)
        {
            var reminderType = Enum.TryParse<ReminderType>(command.Request.ReminderType, true, out var parsed)
                ? parsed
                : ReminderType.Custom;

            var existing = await _preferenceRepo.GetByUserAndTypeAsync(
                command.UserId, command.Request.ReminderType);

            ReminderPreferenceDomain pref;
            if (existing != null)
            {
                existing.Update(
                    command.Request.IsEnabled,
                    command.Request.RemindBeforeMinutes,
                    command.Request.Channel);
                await _preferenceRepo.UpdateAsync(existing);
                pref = existing;
            }
            else
            {
                pref = ReminderPreferenceDomain.Create(
                    userId: command.UserId,
                    reminderType: reminderType,
                    isEnabled: command.Request.IsEnabled,
                    remindBeforeMinutes: command.Request.RemindBeforeMinutes,
                    channel: command.Request.Channel ?? "PushEmail");
                await _preferenceRepo.AddAsync(pref);
            }

            await _unitOfWork.SaveChangesAsync(ct);

            return new ReminderPreferenceResponse
            {
                PreferenceId = pref.Id,
                UserId = pref.UserId,
                ReminderType = pref.ReminderType.ToString(),
                IsEnabled = pref.IsEnabled,
                RemindBeforeMinutes = pref.RemindBeforeMinutes,
                Channel = pref.Channel,
                CreatedAt = pref.CreatedAt,
                UpdatedAt = pref.UpdatedAt
            };
        }
    }
}
