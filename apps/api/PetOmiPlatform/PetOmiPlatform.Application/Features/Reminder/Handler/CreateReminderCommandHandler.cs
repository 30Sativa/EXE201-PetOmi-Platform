using MediatR;
using PetOmiPlatform.Application.Features.Reminder.Command;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Response;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Reminder.Handler
{
    public class CreateReminderCommandHandler : IRequestHandler<CreateReminderCommand, ReminderResponse>
    {
        private readonly IReminderRepository _reminderRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateReminderCommandHandler(
            IReminderRepository reminderRepository,
            IUnitOfWork unitOfWork)
        {
            _reminderRepository = reminderRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ReminderResponse> Handle(CreateReminderCommand command, CancellationToken ct)
        {
            var reminderType = Enum.TryParse<ReminderType>(command.Request.ReminderType, true, out var rt)
                ? rt
                : ReminderType.Custom;

            var sourceType = ReminderSourceType.Owner;
            if (!string.IsNullOrWhiteSpace(command.Request.SourceType))
            {
                Enum.TryParse<ReminderSourceType>(command.Request.SourceType, true, out sourceType);
            }

            var reminder = ReminderDomain.Create(
                userId: command.UserId,
                petId: command.Request.PetId,
                reminderType: reminderType,
                entityType: command.Request.EntityType,
                entityId: command.Request.EntityId,
                sourceType: sourceType,
                createdByUserId: command.UserId,
                title: command.Request.Title,
                message: command.Request.Message,
                remindAt: command.Request.RemindAt,
                repeatRule: command.Request.RepeatRule,
                repeatUntil: command.Request.RepeatUntil);

            await _reminderRepository.AddAsync(reminder);
            await _unitOfWork.SaveChangesAsync(ct);

            return new ReminderResponse
            {
                ReminderId = reminder.Id,
                UserId = reminder.UserId,
                PetId = reminder.PetId,
                ReminderType = reminder.ReminderType.ToString(),
                EntityType = reminder.EntityType,
                EntityId = reminder.EntityId,
                SourceType = reminder.SourceType.ToString(),
                CreatedByUserId = reminder.CreatedByUserId,
                Title = reminder.Title,
                Message = reminder.Message,
                RemindAt = reminder.RemindAt,
                Status = reminder.Status.ToString(),
                IsEnabled = reminder.IsEnabled,
                RepeatRule = reminder.RepeatRule,
                RepeatUntil = reminder.RepeatUntil,
                SentAt = reminder.SentAt,
                DismissedAt = reminder.DismissedAt,
                CreatedAt = reminder.CreatedAt,
                UpdatedAt = reminder.UpdatedAt
            };
        }
    }
}
