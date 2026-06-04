using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.BackgroundServices
{
    public class ReminderProcessorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReminderProcessorService> _logger;
        private readonly TimeSpan _pollingInterval = TimeSpan.FromMinutes(1);

        public ReminderProcessorService(
            IServiceProvider serviceProvider,
            ILogger<ReminderProcessorService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ReminderProcessorService started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingRemindersAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing pending reminders");
                }

                await Task.Delay(_pollingInterval, stoppingToken);
            }

            _logger.LogInformation("ReminderProcessorService stopped");
        }

        private async Task ProcessPendingRemindersAsync(CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var reminderRepo = scope.ServiceProvider.GetRequiredService<IReminderRepository>();
            var dispatcher = scope.ServiceProvider.GetRequiredService<INotificationDispatcher>();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var pendingReminders = await reminderRepo.GetPendingRemindersAsync(DateTime.UtcNow, 100);

            foreach (var reminder in pendingReminders)
            {
                try
                {
                    await dispatcher.DispatchReminderAsync(reminder, ct);
                    reminder.MarkAsSent();
                    await reminderRepo.UpdateAsync(reminder);

                    // If has repeat rule, generate next occurrence
                    await GenerateNextOccurrenceAsync(reminder, reminderRepo, ct);
                    await unitOfWork.SaveChangesAsync(ct);

                    _logger.LogInformation("Reminder {Id} sent and marked as sent", reminder.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process reminder {Id}", reminder.Id);
                }
            }
        }

        private async Task GenerateNextOccurrenceAsync(
            Domain.Entities.ReminderDomain reminder,
            IReminderRepository reminderRepo,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(reminder.RepeatRule))
                return;

            if (reminder.SourceType == ReminderSourceType.System
                && reminder.ReminderType == ReminderType.Medication
                && string.Equals(reminder.EntityType, "PetMedicalRecord", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            try
            {
                var rule = reminder.ParseRepeatRule<RepeatRuleModel>();
                if (rule == null || rule.Type == RepeatType.None)
                    return;

                DateTime nextRemindAt = CalculateNextRemindAt(reminder.RemindAt, rule, DateTime.UtcNow);
                if (nextRemindAt > (reminder.RepeatUntil ?? DateTime.MaxValue))
                    return;

                var nextReminder = Domain.Entities.ReminderDomain.Create(
                    userId: reminder.UserId,
                    petId: reminder.PetId,
                    reminderType: reminder.ReminderType,
                    entityType: reminder.EntityType,
                    entityId: reminder.EntityId,
                    sourceType: reminder.SourceType,
                    createdByUserId: reminder.CreatedByUserId,
                    title: reminder.Title,
                    message: reminder.Message,
                    remindAt: nextRemindAt,
                    repeatRule: reminder.RepeatRule,
                    repeatUntil: reminder.RepeatUntil);

                await reminderRepo.AddAsync(nextReminder);
                _logger.LogInformation("Generated next reminder occurrence at {RemindAt} for reminder {Id}", nextRemindAt, reminder.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate next occurrence for reminder {Id}", reminder.Id);
            }
        }

        private DateTime CalculateNextRemindAt(DateTime currentRemindAt, RepeatRuleModel rule, DateTime now)
        {
            var interval = Math.Max(rule.Interval, 1);
            var nextRemindAt = currentRemindAt;

            do
            {
                nextRemindAt = rule.Type switch
                {
                    RepeatType.Daily => nextRemindAt.AddDays(interval),
                    RepeatType.Weekly => nextRemindAt.AddDays(7 * interval),
                    RepeatType.Monthly => nextRemindAt.AddMonths(interval),
                    _ => nextRemindAt
                };
            }
            while (nextRemindAt <= now && rule.Type != RepeatType.None);

            return nextRemindAt;
        }
    }
}
