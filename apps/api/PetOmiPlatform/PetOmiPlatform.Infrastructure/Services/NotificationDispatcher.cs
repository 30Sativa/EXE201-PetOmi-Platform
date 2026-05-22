using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class NotificationDispatcher : INotificationDispatcher
    {
        private readonly INotificationBroadcaster _broadcaster;
        private readonly IEmailService _emailService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<NotificationDispatcher> _logger;

        public NotificationDispatcher(
            INotificationBroadcaster broadcaster,
            IEmailService emailService,
            IUserRepository userRepository,
            ILogger<NotificationDispatcher> logger)
        {
            _broadcaster = broadcaster;
            _emailService = emailService;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task DispatchReminderAsync(ReminderDomain reminder, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(reminder.UserId);
            if (user == null)
                throw new InvalidOperationException($"User {reminder.UserId} not found for reminder {reminder.Id}");

            var payload = new
            {
                reminderId = reminder.Id,
                title = reminder.Title,
                message = reminder.Message,
                reminderType = reminder.ReminderType.ToString(),
                entityType = reminder.EntityType,
                remindAt = reminder.RemindAt
            };

            // Real-time push via SignalR
            await _broadcaster.SendToUserAsync(reminder.UserId.ToString(), "ReceiveReminder", payload, ct);
            _logger.LogInformation("SignalR notification sent for reminder {Id} to user {UserId}", reminder.Id, reminder.UserId);

            // Email (non-blocking, swallow errors so one channel failure doesn't block others)
            try
            {
                await _emailService.SendReminderEmailAsync(
                    user.Email.Value,
                    reminder.Title,
                    reminder.Message ?? reminder.Title,
                    reminder.ReminderType.ToString());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reminder email for reminder {Id}", reminder.Id);
            }
        }
    }
}
