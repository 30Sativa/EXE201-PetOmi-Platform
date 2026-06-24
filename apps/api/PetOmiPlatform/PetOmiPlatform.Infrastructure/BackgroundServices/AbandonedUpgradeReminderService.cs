using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.BackgroundServices
{
    /// <summary>
    /// "Abandoned Upgrade" nudge: tim cac user dang dung goi Free da DUNG HET quota luot nhan
    /// trong thang ma VAN CHUA nang cap Premium, roi gui nhac (in-app SignalR + email).
    ///
    /// Chong spam: moi user chi nhac toi da 1 lan / chu ky thang (tinh tu ngay 1 dau thang UTC).
    /// Ton trong opt-out: neu user tat loai nhac AbandonedUpgrade trong ReminderPreference thi
    /// background job khong gui email/in-app. (Banner moi lan login do FE xu ly rieng.)
    /// </summary>
    public class AbandonedUpgradeReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AbandonedUpgradeReminderService> _logger;
        private readonly TimeSpan _pollingInterval = TimeSpan.FromMinutes(30);

        public AbandonedUpgradeReminderService(
            IServiceProvider serviceProvider,
            ILogger<AbandonedUpgradeReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AbandonedUpgradeReminderService started");

            // Cho he thong on dinh truoc khi quet lan dau.
            try { await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); }
            catch (OperationCanceledException) { return; }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing abandoned upgrade reminders");
                }

                try { await Task.Delay(_pollingInterval, stoppingToken); }
                catch (OperationCanceledException) { break; }
            }

            _logger.LogInformation("AbandonedUpgradeReminderService stopped");
        }

        private async Task ProcessAsync(CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var subscriptionRepo = scope.ServiceProvider.GetRequiredService<IChatSubscriptionRepository>();
            var accessService = scope.ServiceProvider.GetRequiredService<IChatSubscriptionAccessService>();
            var reminderRepo = scope.ServiceProvider.GetRequiredService<IReminderRepository>();
            var preferenceRepo = scope.ServiceProvider.GetRequiredService<IReminderPreferenceRepository>();
            var dispatcher = scope.ServiceProvider.GetRequiredService<INotificationDispatcher>();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var now = DateTime.UtcNow;
            var cycleStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            // Ung vien: nhung user co nhan tin AI trong thang nay (free user het quota chac chan nam trong nhom nay).
            var candidateUserIds = await subscriptionRepo.GetUserIdsWithMessagesInRangeAsync(cycleStart, cycleStart.AddMonths(1));
            if (candidateUserIds.Count == 0)
                return;

            _logger.LogInformation("AbandonedUpgrade: scanning {Count} candidate users", candidateUserIds.Count);

            foreach (var userId in candidateUserIds)
            {
                if (ct.IsCancellationRequested) break;

                try
                {
                    var access = await accessService.GetAccessAsync(userId, petId: null, ct);

                    // Chi nhac user FREE da het quota (con Premium thi bo qua).
                    if (access.IsPremium || access.RemainingMessages > 0)
                        continue;

                    // Da nhac trong chu ky thang nay roi -> bo qua (chong trung).
                    var alreadyReminded = await reminderRepo.ExistsByUserAndTypeSinceAsync(
                        userId, ReminderType.AbandonedUpgrade, cycleStart);
                    if (alreadyReminded)
                        continue;

                    // Ton trong opt-out: user tat nhac loai nay -> khong gui email/in-app.
                    var pref = await preferenceRepo.GetByUserAndTypeAsync(
                        userId, ReminderType.AbandonedUpgrade.ToString());
                    var optedOut = pref != null && !pref.IsEnabled;

                    var reminder = ReminderDomain.Create(
                        userId: userId,
                        petId: null,
                        reminderType: ReminderType.AbandonedUpgrade,
                        entityType: "ChatSubscription",
                        entityId: null,
                        sourceType: ReminderSourceType.System,
                        createdByUserId: null,
                        title: "Ban da bo do nang cap Premium",
                        message: "Ban da dung het luot tro chuyen mien phi voi PetOmi AI thang nay. "
                                 + "Nang cap Premium de tiep tuc tu van suc khoe thu cung khong gioi han - tiep tuc ngay!",
                        remindAt: now.AddSeconds(5));

                    // Luu lai de co lich su + chong trung (du opt-out van luu, chi khong gui kenh).
                    await reminderRepo.AddAsync(reminder);

                    if (!optedOut)
                    {
                        await dispatcher.DispatchReminderAsync(reminder, ct);
                        reminder.MarkAsSent();
                        await reminderRepo.UpdateAsync(reminder);
                        _logger.LogInformation("AbandonedUpgrade reminder sent to user {UserId}", userId);
                    }
                    else
                    {
                        _logger.LogInformation("AbandonedUpgrade reminder recorded (opted-out, not pushed) for user {UserId}", userId);
                    }

                    await unitOfWork.SaveChangesAsync(ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process abandoned upgrade reminder for user {UserId}", userId);
                }
            }
        }
    }
}
