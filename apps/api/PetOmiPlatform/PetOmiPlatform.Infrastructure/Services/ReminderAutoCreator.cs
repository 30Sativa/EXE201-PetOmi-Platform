using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class ReminderAutoCreator : IReminderAutoCreator
    {
        private readonly IReminderPreferenceRepository _preferenceRepo;
        private readonly ILogger<ReminderAutoCreator> _logger;

        private const int VaccineAdvanceMinutes = 10080; // 7 days
        private const int RecheckAdvanceMinutes = 2880;  // 2 days
        private const int MedicationAdvanceMinutes = 60;  // 1 hour

        public ReminderAutoCreator(
            IReminderPreferenceRepository preferenceRepo,
            ILogger<ReminderAutoCreator> logger)
        {
            _preferenceRepo = preferenceRepo;
            _logger = logger;
        }

        public async Task<List<ReminderDomain>> CreateRemindersFromMedicalRecordAsync(
            PetMedicalRecordDomain medicalRecord,
            Guid ownerUserId,
            string? petName,
            CancellationToken ct = default)
        {
            var reminders = new List<ReminderDomain>();
            var recordType = medicalRecord.RecordType;

            var preference = await _preferenceRepo.GetByUserAndTypeAsync(ownerUserId, recordType);
            if (preference != null && !preference.IsEnabled)
            {
                _logger.LogInformation("Reminder type {Type} disabled for user {UserId}", recordType, ownerUserId);
                return reminders;
            }

            var advanceMinutes = preference?.RemindBeforeMinutes;

            switch (recordType.ToLowerInvariant())
            {
                case "vaccine":
                    reminders.AddRange(CreateVaccinationReminders(medicalRecord, ownerUserId, petName, advanceMinutes));
                    break;

                case "medication":
                    reminders.AddRange(CreateMedicationReminders(medicalRecord, ownerUserId, petName));
                    break;

                default:
                    _logger.LogDebug("No auto-reminder for record type {Type}", recordType);
                    break;
            }

            return reminders;
        }

        public async Task<List<ReminderDomain>> CreateReminderFromAppointmentAsync(
            Guid appointmentId,
            Guid petId,
            Guid ownerUserId,
            DateOnly appointmentDate,
            string? petName,
            CancellationToken ct = default)
        {
            var reminders = new List<ReminderDomain>();

            var preference = await _preferenceRepo.GetByUserAndTypeAsync(ownerUserId, ReminderType.FollowUp.ToString());
            if (preference != null && !preference.IsEnabled)
            {
                _logger.LogInformation("FollowUp reminder disabled for user {UserId}", ownerUserId);
                return reminders;
            }

            var advanceMinutes = preference?.RemindBeforeMinutes ?? RecheckAdvanceMinutes;
            var remindAt = appointmentDate.ToDateTime(new TimeOnly(9, 0)).AddMinutes(-advanceMinutes);

            if (remindAt > DateTime.UtcNow)
            {
                var reminder = ReminderDomain.Create(
                    userId: ownerUserId,
                    petId: petId,
                    reminderType: ReminderType.FollowUp,
                    entityType: "Appointment",
                    entityId: appointmentId,
                    sourceType: ReminderSourceType.System,
                    createdByUserId: null,
                    title: $"Nhắc tái khám cho {petName ?? "thú cưng"}",
                    message: $"Lịch tái khám vào ngày {appointmentDate:dd/MM/yyyy}. Vui lòng đến đúng giờ hoặc liên hệ phòng khám để đổi lịch.",
                    remindAt: remindAt
                );
                reminders.Add(reminder);
            }

            return reminders;
        }

        private List<ReminderDomain> CreateVaccinationReminders(
            PetMedicalRecordDomain record,
            Guid userId,
            string? petName,
            int? advanceMinutesOverride)
        {
            var reminders = new List<ReminderDomain>();
            var advanceMinutes = advanceMinutesOverride ?? VaccineAdvanceMinutes;

            var remindAt = record.RecordDate.ToDateTime(new TimeOnly(9, 0)).AddMinutes(-advanceMinutes);

            if (remindAt > DateTime.UtcNow)
            {
                var reminder = ReminderDomain.Create(
                    userId: userId,
                    petId: record.PetId,
                    reminderType: ReminderType.Vaccine,
                    entityType: "PetMedicalRecord",
                    entityId: record.Id,
                    sourceType: ReminderSourceType.System,
                    createdByUserId: null,
                    title: $"Nhắc tiêm vaccine: {record.Title}",
                    message: $"Vaccine '{record.Title}' cho {petName ?? "thú cưng"} sẽ đến hạn tiêm vào ngày {record.RecordDate:dd/MM/yyyy}. Vui lòng liên hệ phòng khám để đặt lịch.",
                    remindAt: remindAt
                );
                reminders.Add(reminder);
            }

            return reminders;
        }

        private List<ReminderDomain> CreateMedicationReminders(
            PetMedicalRecordDomain record,
            Guid userId,
            string? petName)
        {
            var reminders = new List<ReminderDomain>();

            if (!record.StartDate.HasValue || !record.EndDate.HasValue)
                return reminders;

            var medicationName = record.MedicationName ?? record.Title;
            var dosage = record.Dosage ?? "";

            var timesPerDay = new[] { "08:00", "20:00" };
            var currentDate = record.StartDate.Value;

            while (currentDate <= record.EndDate.Value)
            {
                foreach (var timeStr in timesPerDay)
                {
                    var parts = timeStr.Split(':');
                    var time = new TimeOnly(int.Parse(parts[0]), int.Parse(parts[1]));
                    var remindAt = currentDate.ToDateTime(time).AddMinutes(-MedicationAdvanceMinutes);

                    if (remindAt > DateTime.UtcNow)
                    {
                        var reminder = ReminderDomain.Create(
                            userId: userId,
                            petId: record.PetId,
                            reminderType: ReminderType.Medication,
                            entityType: "PetMedicalRecord",
                            entityId: record.Id,
                            sourceType: ReminderSourceType.System,
                            createdByUserId: null,
                            title: $"Nhắc uống thuốc: {medicationName}",
                            message: $"Đã đến giờ uống thuốc {medicationName} cho {petName ?? "thú cưng"}. Liều lượng: {dosage}.",
                            remindAt: remindAt,
                            repeatRule: ReminderDomain.SerializeRepeatRule(new RepeatRuleModel
                            {
                                Type = RepeatType.Daily,
                                Interval = 1,
                                TimesPerDay = timesPerDay,
                                Until = record.EndDate.Value.ToDateTime(TimeOnly.MaxValue)
                            }),
                            repeatUntil: record.EndDate.Value.ToDateTime(TimeOnly.MaxValue)
                        );
                        reminders.Add(reminder);
                    }
                }

                currentDate = currentDate.AddDays(1);
            }

            return reminders;
        }
    }
}
