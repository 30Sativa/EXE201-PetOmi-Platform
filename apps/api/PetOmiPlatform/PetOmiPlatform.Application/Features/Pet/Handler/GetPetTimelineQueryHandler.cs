using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class GetPetTimelineQueryHandler : IRequestHandler<GetPetTimelineQuery, PetTimelineResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetMedicalRecordRepository _medicalRecordRepository;
        private readonly IPetWeightLogRepository _weightLogRepository;
        private readonly IPetPhotoRepository _photoRepository;
        private readonly IPetHealthProfileRepository _healthProfileRepository;
        private readonly IReminderRepository _reminderRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPetAccessService _accessService;

        public GetPetTimelineQueryHandler(
            IPetRepository petRepository,
            IPetMedicalRecordRepository medicalRecordRepository,
            IPetWeightLogRepository weightLogRepository,
            IPetPhotoRepository photoRepository,
            IPetHealthProfileRepository healthProfileRepository,
            IReminderRepository reminderRepository,
            IAppointmentRepository appointmentRepository,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _medicalRecordRepository = medicalRecordRepository;
            _weightLogRepository = weightLogRepository;
            _photoRepository = photoRepository;
            _healthProfileRepository = healthProfileRepository;
            _reminderRepository = reminderRepository;
            _appointmentRepository = appointmentRepository;
            _accessService = accessService;
        }

        public async Task<PetTimelineResponse> Handle(GetPetTimelineQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanReadAsync(pet, query.UserId, cancellationToken);

            var allActivities = new List<PetActivityResponse>();

            // 1. Medical Records
            if (ShouldInclude(query.ActivityType, "MedicalRecord"))
            {
                var medicalRecords = await _medicalRecordRepository.GetByPetIdAsync(query.PetId);
                foreach (var record in medicalRecords)
                {
                    var occurredAt = record.RecordDate.ToDateTime(TimeOnly.MinValue);
                    if (!MatchesDateRange(occurredAt, query.FromDate, query.ToDate))
                        continue;

                    allActivities.Add(new PetActivityResponse
                    {
                        ActivityId = record.Id,
                        PetId = record.PetId,
                        ActivityType = "MedicalRecord",
                        Title = record.Title,
                        Description = record.Description,
                        OccurredAt = occurredAt,
                        CreatedAt = record.CreatedAt,
                        SourceId = record.Id,
                        Icon = GetMedicalRecordIcon(record.RecordType),
                        Color = GetMedicalRecordColor(record.RecordType),
                        Metadata = SerializeMetadata(new
                        {
                            recordType = record.RecordType,
                            vetName = record.VetName,
                            clinicName = record.ClinicName,
                            medicationName = record.MedicationName,
                            dosage = record.Dosage,
                            startDate = record.StartDate?.ToString("yyyy-MM-dd"),
                            endDate = record.EndDate?.ToString("yyyy-MM-dd"),
                            attachmentUrl = record.AttachmentUrl
                        })
                    });
                }
            }

            // 2. Weight Logs
            if (ShouldInclude(query.ActivityType, "WeightLog"))
            {
                var weightLogs = await _weightLogRepository.GetByPetIdAsync(query.PetId);
                foreach (var log in weightLogs)
                {
                    if (!MatchesDateRange(log.MeasuredAt, query.FromDate, query.ToDate))
                        continue;

                    allActivities.Add(new PetActivityResponse
                    {
                        ActivityId = log.Id,
                        PetId = log.PetId,
                        ActivityType = "WeightLog",
                        Title = $"Ghi nhận cân nặng: {log.WeightKg:F1} kg",
                        Description = log.Note,
                        OccurredAt = log.MeasuredAt,
                        CreatedAt = log.CreatedAt,
                        SourceId = log.Id,
                        Icon = "scale",
                        Color = "#10B981",
                        Metadata = SerializeMetadata(new
                        {
                            weightKg = log.WeightKg,
                            source = log.Source,
                            note = log.Note
                        })
                    });
                }
            }

            // 3. Photos
            if (ShouldInclude(query.ActivityType, "Photo"))
            {
                var photos = await _photoRepository.GetByPetIdAsync(query.PetId);
                foreach (var photo in photos)
                {
                    if (!photo.TakenAt.HasValue)
                        continue;
                    if (!MatchesDateRange(photo.TakenAt.Value, query.FromDate, query.ToDate))
                        continue;

                    allActivities.Add(new PetActivityResponse
                    {
                        ActivityId = photo.Id,
                        PetId = photo.PetId,
                        ActivityType = "Photo",
                        Title = photo.IsAvatar ? "Cập nhật ảnh đại diện" : "Thêm ảnh mới",
                        Description = photo.Caption,
                        OccurredAt = photo.TakenAt.Value,
                        CreatedAt = photo.CreatedAt,
                        SourceId = photo.Id,
                        Icon = "camera",
                        Color = "#8B5CF6",
                        Metadata = SerializeMetadata(new
                        {
                            imageUrl = photo.ImageUrl,
                            caption = photo.Caption,
                            isAvatar = photo.IsAvatar,
                            takenAt = photo.TakenAt?.ToString("yyyy-MM-ddTHH:mm:ssZ")
                        })
                    });
                }
            }

            // 4. Reminders (Nhắc nhở)
            if (ShouldInclude(query.ActivityType, "Reminder"))
            {
                var reminders = await _reminderRepository.GetByPetIdAsync(query.PetId);
                foreach (var reminder in reminders)
                {
                    if (!MatchesDateRange(reminder.RemindAt, query.FromDate, query.ToDate))
                        continue;

                    allActivities.Add(new PetActivityResponse
                    {
                        ActivityId = reminder.Id,
                        PetId = reminder.PetId ?? query.PetId,
                        ActivityType = "Reminder",
                        Title = reminder.Title,
                        Description = reminder.Message,
                        OccurredAt = reminder.RemindAt,
                        CreatedAt = reminder.CreatedAt,
                        SourceId = reminder.Id,
                        Icon = GetReminderIcon(reminder.ReminderType),
                        Color = GetReminderColor(reminder.ReminderType),
                        Metadata = SerializeMetadata(new
                        {
                            reminderType = reminder.ReminderType.ToString(),
                            status = reminder.Status.ToString(),
                            isEnabled = reminder.IsEnabled,
                            sourceType = reminder.SourceType.ToString(),
                            repeatRule = reminder.RepeatRule
                        })
                    });
                }
            }

            // 5. Appointments
            if (ShouldInclude(query.ActivityType, "Appointment"))
            {
                var appointments = await _appointmentRepository.GetByPetIdAsync(query.PetId, 1, 1000);
                foreach (var appt in appointments)
                {
                    var occurredAt = appt.AppointmentDate.ToDateTime(appt.StartTime);
                    if (!MatchesDateRange(occurredAt, query.FromDate, query.ToDate))
                        continue;

                    allActivities.Add(new PetActivityResponse
                    {
                        ActivityId = appt.Id,
                        PetId = appt.PetId,
                        ActivityType = "Appointment",
                        Title = $"Lịch hẹn khám: {appt.AppointmentType}",
                        Description = appt.Notes,
                        OccurredAt = occurredAt,
                        CreatedAt = appt.CreatedAt,
                        SourceId = appt.Id,
                        Icon = "calendar",
                        Color = "#3B82F6",
                        Metadata = SerializeMetadata(new
                        {
                            appointmentType = appt.AppointmentType.ToString(),
                            status = appt.Status.ToString(),
                            startTime = appt.StartTime.ToString("HH:mm"),
                            endTime = appt.EndTime.ToString("HH:mm"),
                            isWalkIn = appt.IsWalkIn
                        })
                    });
                }
            }

            // 6. Health Profile Created
            if (ShouldInclude(query.ActivityType, "HealthProfile"))
            {
                var profile = await _healthProfileRepository.GetByPetIdAsync(query.PetId);
                if (profile != null)
                {
                    if (MatchesDateRange(profile.CreatedAt, query.FromDate, query.ToDate))
                    {
                        allActivities.Add(new PetActivityResponse
                        {
                            ActivityId = profile.Id,
                            PetId = profile.PetId,
                            ActivityType = "HealthProfile",
                            Title = "Tạo hồ sơ sức khỏe",
                            Description = null,
                            OccurredAt = profile.CreatedAt,
                            CreatedAt = profile.CreatedAt,
                            SourceId = profile.Id,
                            Icon = "heart",
                            Color = "#EF4444",
                            Metadata = SerializeMetadata(new
                            {
                                allergies = profile.Allergies,
                                chronicConditions = profile.ChronicConditions,
                                microchipNumber = profile.MicrochipNumber,
                                currentWeightKg = profile.CurrentWeightKg
                            })
                        });
                    }
                }
            }

            // Sort by OccurredAt descending (newest first)
            var sorted = allActivities
                .OrderByDescending(a => a.OccurredAt)
                .ToList();

            var totalCount = sorted.Count;
            var paged = sorted
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToList();

            return new PetTimelineResponse
            {
                Activities = paged,
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize,
                HasNextPage = query.Page * query.PageSize < totalCount
            };
        }

        private static bool ShouldInclude(string? filterType, string activityType)
        {
            return string.IsNullOrEmpty(filterType)
                || filterType.Equals(activityType, StringComparison.OrdinalIgnoreCase);
        }

        private static bool MatchesDateRange(DateTime occurredAt, DateTime? from, DateTime? to)
        {
            if (from.HasValue && occurredAt < from.Value)
                return false;
            if (to.HasValue && occurredAt > to.Value)
                return false;
            return true;
        }

        private static string GetMedicalRecordIcon(string recordType)
        {
            return recordType.ToLowerInvariant() switch
            {
                "vaccine" => "syringe",
                "visit" => "stethoscope",
                "medication" => "pill",
                "surgery" => "scissors",
                "allergy" => "alert-triangle",
                "illness" => "thermometer",
                _ => "file-text"
            };
        }

        private static string GetMedicalRecordColor(string recordType)
        {
            return recordType.ToLowerInvariant() switch
            {
                "vaccine" => "#22C55E",
                "visit" => "#3B82F6",
                "medication" => "#F59E0B",
                "surgery" => "#EF4444",
                "allergy" => "#F97316",
                "illness" => "#DC2626",
                _ => "#6B7280"
            };
        }

        private static string GetReminderIcon(ReminderType reminderType)
        {
            return reminderType switch
            {
                ReminderType.Vaccine => "syringe",
                ReminderType.Medication => "pill",
                ReminderType.FollowUp => "repeat",
                ReminderType.Deworming => "bug",
                ReminderType.Grooming => "scissors",
                ReminderType.WeightTracking => "scale",
                ReminderType.Custom => "bell",
                _ => "bell"
            };
        }

        private static string GetReminderColor(ReminderType reminderType)
        {
            return reminderType switch
            {
                ReminderType.Vaccine => "#22C55E",
                ReminderType.Medication => "#F59E0B",
                ReminderType.FollowUp => "#3B82F6",
                ReminderType.Deworming => "#A855F7",
                ReminderType.Grooming => "#EC4899",
                ReminderType.WeightTracking => "#10B981",
                ReminderType.Custom => "#6B7280",
                _ => "#6B7280"
            };
        }

        private static string SerializeMetadata(object data)
        {
            return JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            });
        }
    }
}
