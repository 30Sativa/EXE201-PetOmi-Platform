using MediatR;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Response;
using PetOmiPlatform.Application.Features.Reminder.Query;

namespace PetOmiPlatform.Application.Features.Reminder.Handler
{
    public class GetUserRemindersQueryHandler : IRequestHandler<GetUserRemindersQuery, List<ReminderResponse>>
    {
        private readonly Domain.Interfaces.Repositories.IReminderRepository _reminderRepository;

        public GetUserRemindersQueryHandler(
            Domain.Interfaces.Repositories.IReminderRepository reminderRepository)
        {
            _reminderRepository = reminderRepository;
        }

        public async Task<List<ReminderResponse>> Handle(
            GetUserRemindersQuery query, CancellationToken ct)
        {
            var reminders = await _reminderRepository.GetByUserIdAsync(query.UserId);
            return reminders.Select(r => new ReminderResponse
            {
                ReminderId = r.Id,
                UserId = r.UserId,
                PetId = r.PetId,
                ReminderType = r.ReminderType.ToString(),
                EntityType = r.EntityType,
                EntityId = r.EntityId,
                SourceType = r.SourceType.ToString(),
                CreatedByUserId = r.CreatedByUserId,
                Title = r.Title,
                Message = r.Message,
                RemindAt = r.RemindAt,
                Status = r.Status.ToString(),
                IsEnabled = r.IsEnabled,
                RepeatRule = r.RepeatRule,
                RepeatUntil = r.RepeatUntil,
                SentAt = r.SentAt,
                DismissedAt = r.DismissedAt,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            }).ToList();
        }
    }
}
