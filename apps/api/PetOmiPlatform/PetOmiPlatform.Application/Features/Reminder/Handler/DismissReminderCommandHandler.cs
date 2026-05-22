using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Reminder.Command;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Reminder.Handler
{
    public class DismissReminderCommandHandler : IRequestHandler<DismissReminderCommand, ReminderResponse>
    {
        private readonly IReminderRepository _reminderRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DismissReminderCommandHandler(
            IReminderRepository reminderRepository,
            IUnitOfWork unitOfWork)
        {
            _reminderRepository = reminderRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ReminderResponse> Handle(DismissReminderCommand command, CancellationToken ct)
        {
            var reminder = await _reminderRepository.GetByIdAsync(command.ReminderId)
                ?? throw new NotFoundException("Reminder", command.ReminderId);

            if (reminder.UserId != command.UserId)
                throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này.");

            reminder.Dismiss();
            await _reminderRepository.UpdateAsync(reminder);
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
