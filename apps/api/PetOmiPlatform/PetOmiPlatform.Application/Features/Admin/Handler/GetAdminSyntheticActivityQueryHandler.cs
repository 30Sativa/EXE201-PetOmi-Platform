using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Features.Admin.Queries;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public sealed class GetAdminSyntheticActivityQueryHandler
    : IRequestHandler<GetAdminSyntheticActivityQuery, AdminSyntheticActivityResponse>
{
    private static readonly DateTime DefaultFromDate = new(2026, 7, 1);
    private static readonly DateTime DefaultToDate = new(2026, 7, 31);
    private readonly IAdminSyntheticActivityReader _reader;

    public GetAdminSyntheticActivityQueryHandler(IAdminSyntheticActivityReader reader)
    {
        _reader = reader;
    }

    public async Task<AdminSyntheticActivityResponse> Handle(
        GetAdminSyntheticActivityQuery request,
        CancellationToken cancellationToken)
    {
        var fromUtc = DateTime.SpecifyKind((request.FromDate ?? DefaultFromDate).Date, DateTimeKind.Utc);
        var toUtc = DateTime.SpecifyKind((request.ToDate ?? DefaultToDate).Date, DateTimeKind.Utc);

        if (toUtc < fromUtc)
            throw new BadRequestException("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");

        if ((toUtc - fromUtc).TotalDays > 366)
            throw new BadRequestException("Khoảng thống kê tối đa là 366 ngày.");

        var origin = (request.Origin ?? "real").Trim().ToLowerInvariant();
        if (origin is not ("real" or "synthetic"))
            throw new BadRequestException("Nguồn dữ liệu chỉ nhận 'real' hoặc 'synthetic'.");

        var isSynthetic = origin == "synthetic";
        var toExclusiveUtc = toUtc.AddDays(1);
        var data = await _reader.ReadAsync(fromUtc, toExclusiveUtc, isSynthetic, cancellationToken);

        var petsInRange = data.Pets
            .Where(pet => IsInRange(pet.CreatedAt, fromUtc, toExclusiveUtc))
            .ToList();
        var ownerMessages = data.Messages
            .Where(message => IsOwnerMessage(message.SenderRole))
            .ToList();
        var aiResponses = data.Messages
            .Where(message => IsAiMessage(message.SenderRole))
            .ToList();

        var petCreatorIds = petsInRange.Select(pet => pet.UserId).ToHashSet();
        var serviceUserIds = ownerMessages.Select(message => message.UserId)
            .Concat(data.MedicalNotes.Select(note => note.UserId))
            .Concat(data.Reminders.Select(reminder => reminder.UserId))
            .ToHashSet();
        var allPetOwnerIds = data.Pets.Select(pet => pet.UserId).ToHashSet();

        var dailyActivity = BuildDailyActivity(
            fromUtc,
            toUtc,
            petsInRange,
            data.Sessions,
            ownerMessages,
            aiResponses,
            data.MedicalNotes,
            data.Reminders);

        var userItems = data.Users
            .Select(user => BuildUserItem(
                user,
                isSynthetic,
                fromUtc,
                toExclusiveUtc,
                data.Pets,
                data.Sessions,
                ownerMessages,
                aiResponses,
                data.MedicalNotes,
                data.Reminders))
            .OrderByDescending(user => user.QualifiedForScenario)
            .ThenByDescending(user => user.ActiveDays)
            .ThenBy(user => user.FullName ?? user.Email)
            .ToList();

        var sessionDurations = data.Sessions
            .Where(session => session.LogoutAt.HasValue && session.LogoutAt.Value >= session.CreatedAt)
            .Select(session => (decimal)(session.LogoutAt!.Value - session.CreatedAt).TotalMinutes)
            .ToList();

        return new AdminSyntheticActivityResponse
        {
            DataOrigin = isSynthetic ? "SYNTHETIC" : "REAL",
            DatasetLabel = isSynthetic
                ? "DỮ LIỆU DEMO / MÔ PHỎNG"
                : "DỮ LIỆU GHI NHẬN QUA HỆ THỐNG",
            Notice = isSynthetic
                ? "Không phải hành vi khách hàng thật và không được dùng làm bằng chứng người dùng thật."
                : "Chỉ thống kê các bản ghi thật đang có trong hệ thống; không bổ sung hoặc lùi ngày hoạt động.",
            FromDate = fromUtc.ToString("yyyy-MM-dd"),
            ToDate = toUtc.ToString("yyyy-MM-dd"),
            Summary = new AdminSyntheticActivitySummary
            {
                UsersInDataset = data.Users.Count,
                UsersWithPet = allPetOwnerIds.Count,
                UsersWhoCreatedPetInRange = petCreatorIds.Count,
                UsersWhoUsedServiceInRange = serviceUserIds.Count,
                QualifiedUsers = petCreatorIds.Intersect(serviceUserIds).Count(),
                PetsCreated = petsInRange.Count,
                ActiveUserDays = dailyActivity.Sum(day => day.ActiveUsers),
                OwnerMessages = ownerMessages.Count,
                AiResponses = aiResponses.Count,
                MedicalNotes = data.MedicalNotes.Count,
                RemindersCreated = data.Reminders.Count,
                AverageSessionMinutes = sessionDurations.Count == 0
                    ? 0
                    : Math.Round(sessionDurations.Average(), 1)
            },
            DailyActivity = dailyActivity,
            Users = userItems
        };
    }

    private static List<AdminSyntheticDailyActivityItem> BuildDailyActivity(
        DateTime fromUtc,
        DateTime toUtc,
        IReadOnlyCollection<SyntheticActivityPetReadModel> pets,
        IReadOnlyCollection<SyntheticActivitySessionReadModel> sessions,
        IReadOnlyCollection<SyntheticActivityMessageReadModel> ownerMessages,
        IReadOnlyCollection<SyntheticActivityMessageReadModel> aiResponses,
        IReadOnlyCollection<SyntheticActivityMedicalNoteReadModel> medicalNotes,
        IReadOnlyCollection<SyntheticActivityReminderReadModel> reminders)
    {
        var rows = new List<AdminSyntheticDailyActivityItem>();

        for (var date = fromUtc.Date; date <= toUtc.Date; date = date.AddDays(1))
        {
            var activeUserIds = sessions
                .Where(session => session.CreatedAt.Date == date)
                .Select(session => session.UserId)
                .Concat(ownerMessages.Where(message => message.CreatedAt.Date == date).Select(message => message.UserId))
                .Concat(medicalNotes.Where(note => note.CreatedAt.Date == date).Select(note => note.UserId))
                .Concat(reminders.Where(reminder => reminder.CreatedAt.Date == date).Select(reminder => reminder.UserId))
                .Concat(pets.Where(pet => pet.CreatedAt.Date == date).Select(pet => pet.UserId))
                .Distinct()
                .Count();

            rows.Add(new AdminSyntheticDailyActivityItem
            {
                Date = date.ToString("yyyy-MM-dd"),
                ActiveUsers = activeUserIds,
                PetsCreated = pets.Count(pet => pet.CreatedAt.Date == date),
                OwnerMessages = ownerMessages.Count(message => message.CreatedAt.Date == date),
                AiResponses = aiResponses.Count(message => message.CreatedAt.Date == date),
                MedicalNotes = medicalNotes.Count(note => note.CreatedAt.Date == date),
                RemindersCreated = reminders.Count(reminder => reminder.CreatedAt.Date == date)
            });
        }

        return rows;
    }

    private static AdminSyntheticUserActivityItem BuildUserItem(
        SyntheticActivityUserReadModel user,
        bool isSynthetic,
        DateTime fromUtc,
        DateTime toExclusiveUtc,
        IReadOnlyCollection<SyntheticActivityPetReadModel> pets,
        IReadOnlyCollection<SyntheticActivitySessionReadModel> sessions,
        IReadOnlyCollection<SyntheticActivityMessageReadModel> ownerMessages,
        IReadOnlyCollection<SyntheticActivityMessageReadModel> aiResponses,
        IReadOnlyCollection<SyntheticActivityMedicalNoteReadModel> medicalNotes,
        IReadOnlyCollection<SyntheticActivityReminderReadModel> reminders)
    {
        var userPets = pets.Where(pet => pet.UserId == user.UserId).ToList();
        var userSessions = sessions.Where(session => session.UserId == user.UserId).ToList();
        var userOwnerMessages = ownerMessages.Where(message => message.UserId == user.UserId).ToList();
        var userAiResponses = aiResponses.Where(message => message.UserId == user.UserId).ToList();
        var userMedicalNotes = medicalNotes.Where(note => note.UserId == user.UserId).ToList();
        var userReminders = reminders.Where(reminder => reminder.UserId == user.UserId).ToList();

        var activityTimes = userSessions.Select(session => session.CreatedAt)
            .Concat(userOwnerMessages.Select(message => message.CreatedAt))
            .Concat(userMedicalNotes.Select(note => note.CreatedAt))
            .Concat(userReminders.Select(reminder => reminder.CreatedAt))
            .ToList();

        var activeDays = activityTimes.Select(value => value.Date).Distinct().Count();
        var createdPetInRange = userPets.Any(pet => IsInRange(pet.CreatedAt, fromUtc, toExclusiveUtc));
        var usedServiceInRange = userOwnerMessages.Count + userMedicalNotes.Count + userReminders.Count > 0;

        return new AdminSyntheticUserActivityItem
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            IsSynthetic = isSynthetic,
            PetNames = userPets.Select(pet => pet.Name).Distinct().OrderBy(name => name).ToList(),
            FirstPetCreatedAt = userPets.Count == 0
                ? null
                : userPets.Min(pet => pet.CreatedAt).ToString("O"),
            ActiveDays = activeDays,
            OwnerMessages = userOwnerMessages.Count,
            AiResponses = userAiResponses.Count,
            MedicalNotes = userMedicalNotes.Count,
            RemindersCreated = userReminders.Count,
            FirstActivityAt = activityTimes.Count == 0 ? null : activityTimes.Min().ToString("O"),
            LastActivityAt = activityTimes.Count == 0 ? null : activityTimes.Max().ToString("O"),
            CreatedPetInRange = createdPetInRange,
            UsedServiceInRange = usedServiceInRange,
            QualifiedForScenario = createdPetInRange && usedServiceInRange
        };
    }

    private static bool IsInRange(DateTime value, DateTime fromUtc, DateTime toExclusiveUtc) =>
        value >= fromUtc && value < toExclusiveUtc;

    private static bool IsOwnerMessage(string senderRole) =>
        string.Equals(senderRole, "user", StringComparison.OrdinalIgnoreCase);

    private static bool IsAiMessage(string senderRole) =>
        string.Equals(senderRole, "assistant", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(senderRole, "AI", StringComparison.OrdinalIgnoreCase);
}
