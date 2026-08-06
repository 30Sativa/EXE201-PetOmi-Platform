using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Features.Admin.Queries;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public sealed class GetAdminUserBehaviorQueryHandler
    : IRequestHandler<GetAdminUserBehaviorQuery, AdminUserBehaviorResponse>
{
    private readonly IAdminUserBehaviorReader _reader;

    public GetAdminUserBehaviorQueryHandler(IAdminUserBehaviorReader reader)
    {
        _reader = reader;
    }

    public async Task<AdminUserBehaviorResponse> Handle(
        GetAdminUserBehaviorQuery request,
        CancellationToken cancellationToken)
    {
        var todayUtc = DateTime.UtcNow.Date;
        var fromUtc = DateTime.SpecifyKind((request.FromDate ?? todayUtc.AddDays(-29)).Date, DateTimeKind.Utc);
        var toUtc = DateTime.SpecifyKind((request.ToDate ?? todayUtc).Date, DateTimeKind.Utc);

        if (toUtc < fromUtc)
            throw new BadRequestException("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");

        if ((toUtc - fromUtc).TotalDays > 366)
            throw new BadRequestException("Khoảng thống kê tối đa là 366 ngày.");

        var origin = (request.Origin ?? "all").Trim().ToLowerInvariant();
        if (origin is not ("all" or "real" or "synthetic"))
            throw new BadRequestException("Nguồn dữ liệu chỉ nhận 'all', 'real' hoặc 'synthetic'.");

        bool? isSynthetic = origin switch
        {
            "real" => false,
            "synthetic" => true,
            _ => null
        };

        var toExclusiveUtc = toUtc.AddDays(1);
        var data = await _reader.ReadAsync(fromUtc, toExclusiveUtc, isSynthetic, cancellationToken);
        var petsInRange = data.Pets.Where(pet => IsInRange(pet.CreatedAt, fromUtc, toExclusiveUtc)).ToList();
        var ownerMessages = data.Messages.Where(message => IsOwnerMessage(message.SenderRole)).ToList();
        var aiResponses = data.Messages.Where(message => IsAiMessage(message.SenderRole)).ToList();

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
                fromUtc,
                toExclusiveUtc,
                data.Pets,
                data.Sessions,
                ownerMessages,
                aiResponses,
                data.MedicalNotes,
                data.Reminders))
            .OrderByDescending(user => user.EngagementScore)
            .ThenByDescending(user => user.LastActivityAt)
            .ThenBy(user => user.FullName ?? user.Email)
            .ToList();

        var activeUsers = userItems.Count(user => user.TotalActions > 0);
        var activatedUsers = userItems.Count(user => user.HasPet && user.UsedServiceInRange);
        var returningUsers = userItems.Count(user => user.IsReturning);
        var dormantUsers = userItems.Count(user => user.TotalActions == 0);
        var validSessionDurations = data.Sessions
            .Where(session => session.LogoutAt.HasValue && session.LogoutAt.Value >= session.CreatedAt)
            .Select(session => (decimal)(session.LogoutAt!.Value - session.CreatedAt).TotalMinutes)
            .Where(minutes => minutes <= 480)
            .ToList();

        var summary = new AdminUserBehaviorSummary
        {
            UsersInDataset = data.Users.Count,
            NewUsers = data.Users.Count(user => IsInRange(user.CreatedAt, fromUtc, toExclusiveUtc)),
            ActiveUsers = activeUsers,
            ActivatedUsers = activatedUsers,
            ReturningUsers = returningUsers,
            DormantUsers = dormantUsers,
            PetsCreated = petsInRange.Count,
            Conversations = ownerMessages.Select(message => message.ConversationId).Distinct().Count(),
            OwnerMessages = ownerMessages.Count,
            AiResponses = aiResponses.Count,
            MedicalNotes = data.MedicalNotes.Count,
            RemindersCreated = data.Reminders.Count,
            TotalSessions = data.Sessions.Count,
            AverageSessionMinutes = validSessionDurations.Count == 0
                ? 0
                : Math.Round(validSessionDurations.Average(), 1),
            AverageDailyActiveUsers = dailyActivity.Count == 0
                ? 0
                : Math.Round((decimal)dailyActivity.Average(day => day.ActiveUsers), 1),
            EngagementRate = Percentage(activeUsers, data.Users.Count),
            ActivationRate = Percentage(activatedUsers, data.Users.Count),
            ReturnRate = Percentage(returningUsers, Math.Max(activeUsers, 1))
        };

        var funnel = BuildFunnel(userItems);
        var featureAdoption = BuildFeatureAdoption(
            userItems,
            petsInRange.Count,
            ownerMessages.Count,
            data.MedicalNotes.Count,
            data.Reminders.Count,
            Math.Max(activeUsers, 1));
        var segments = BuildSegments(userItems);
        var chatAnalytics = BuildChatAnalytics(ownerMessages, userItems, summary.Conversations);

        return new AdminUserBehaviorResponse
        {
            DataOrigin = origin.ToUpperInvariant(),
            DatasetLabel = origin switch
            {
                "real" => "Người dùng thường",
                "synthetic" => "Dữ liệu demo",
                _ => "Toàn bộ người dùng"
            },
            FromDate = fromUtc.ToString("yyyy-MM-dd"),
            ToDate = toUtc.ToString("yyyy-MM-dd"),
            GeneratedAt = DateTime.UtcNow,
            Summary = summary,
            ChatAnalytics = chatAnalytics,
            Funnel = funnel,
            FeatureAdoption = featureAdoption,
            Segments = segments,
            Insights = BuildInsights(summary, featureAdoption),
            DailyActivity = dailyActivity,
            Users = userItems
        };
    }

    private static AdminChatBehaviorAnalytics BuildChatAnalytics(
        IReadOnlyCollection<UserBehaviorMessageReadModel> ownerMessages,
        IReadOnlyCollection<AdminUserBehaviorItem> users,
        int conversations)
    {
        var chatUserIds = ownerMessages.Select(message => message.UserId).Distinct().ToHashSet();
        var topics = ownerMessages
            .GroupBy(message => NormalizeIntent(message.Intent), StringComparer.OrdinalIgnoreCase)
            .Select(group => new AdminChatTopicItem
            {
                Intent = group.Key,
                Label = IntentLabel(group.Key),
                Questions = group.Count(),
                Users = group.Select(message => message.UserId).Distinct().Count(),
                Percentage = Percentage(group.Count(), ownerMessages.Count)
            })
            .OrderByDescending(topic => topic.Questions)
            .ThenBy(topic => topic.Label)
            .Take(8)
            .ToList();

        var topQuestions = ownerMessages
            .Where(message => !string.IsNullOrWhiteSpace(message.Content))
            .GroupBy(message => NormalizeQuestion(message.Content), StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                var intent = NormalizeIntent(group
                    .Where(message => !string.IsNullOrWhiteSpace(message.Intent))
                    .GroupBy(message => message.Intent!, StringComparer.OrdinalIgnoreCase)
                    .OrderByDescending(intentGroup => intentGroup.Count())
                    .Select(intentGroup => intentGroup.Key)
                    .FirstOrDefault());

                return new AdminTopQuestionItem
                {
                    Question = Truncate(group.Key, 180),
                    Intent = intent,
                    IntentLabel = IntentLabel(intent),
                    AskCount = group.Count(),
                    Users = group.Select(message => message.UserId).Distinct().Count(),
                    LastAskedAt = group.Max(message => message.CreatedAt).ToString("O")
                };
            })
            .OrderByDescending(question => question.AskCount)
            .ThenByDescending(question => question.LastAskedAt)
            .Take(8)
            .ToList();

        var topUsers = users
            .Where(user => user.OwnerMessages > 0)
            .OrderByDescending(user => user.OwnerMessages)
            .ThenByDescending(user => user.Conversations)
            .Take(6)
            .Select(user => new AdminTopChatUserItem
            {
                UserId = user.UserId,
                Email = user.Email,
                FullName = user.FullName,
                Questions = user.OwnerMessages,
                Conversations = user.Conversations,
                ActiveDays = user.ActiveDays
            })
            .ToList();

        return new AdminChatBehaviorAnalytics
        {
            TotalQuestions = ownerMessages.Count,
            UniqueChatUsers = chatUserIds.Count,
            QuestionsPerChatUser = chatUserIds.Count == 0
                ? 0
                : Math.Round((decimal)ownerMessages.Count / chatUserIds.Count, 1),
            QuestionsPerConversation = conversations == 0
                ? 0
                : Math.Round((decimal)ownerMessages.Count / conversations, 1),
            TopTopics = topics,
            TopQuestions = topQuestions,
            TopUsers = topUsers
        };
    }

    private static List<AdminUserBehaviorDailyItem> BuildDailyActivity(
        DateTime fromUtc,
        DateTime toUtc,
        IReadOnlyCollection<UserBehaviorPetReadModel> pets,
        IReadOnlyCollection<UserBehaviorSessionReadModel> sessions,
        IReadOnlyCollection<UserBehaviorMessageReadModel> ownerMessages,
        IReadOnlyCollection<UserBehaviorMessageReadModel> aiResponses,
        IReadOnlyCollection<UserBehaviorMedicalNoteReadModel> medicalNotes,
        IReadOnlyCollection<UserBehaviorReminderReadModel> reminders)
    {
        var rows = new List<AdminUserBehaviorDailyItem>();

        for (var date = fromUtc.Date; date <= toUtc.Date; date = date.AddDays(1))
        {
            var daySessions = sessions.Where(session => session.CreatedAt.Date == date).ToList();
            var dayOwnerMessages = ownerMessages.Where(message => message.CreatedAt.Date == date).ToList();
            var dayMedicalNotes = medicalNotes.Where(note => note.CreatedAt.Date == date).ToList();
            var dayReminders = reminders.Where(reminder => reminder.CreatedAt.Date == date).ToList();
            var dayPets = pets.Where(pet => pet.CreatedAt.Date == date).ToList();
            var activeUserIds = daySessions.Select(session => session.UserId)
                .Concat(dayOwnerMessages.Select(message => message.UserId))
                .Concat(dayMedicalNotes.Select(note => note.UserId))
                .Concat(dayReminders.Select(reminder => reminder.UserId))
                .Concat(dayPets.Select(pet => pet.UserId))
                .Distinct()
                .Count();

            rows.Add(new AdminUserBehaviorDailyItem
            {
                Date = date.ToString("yyyy-MM-dd"),
                ActiveUsers = activeUserIds,
                Sessions = daySessions.Count,
                Conversations = dayOwnerMessages.Select(message => message.ConversationId).Distinct().Count(),
                PetsCreated = dayPets.Count,
                OwnerMessages = dayOwnerMessages.Count,
                AiResponses = aiResponses.Count(message => message.CreatedAt.Date == date),
                MedicalNotes = dayMedicalNotes.Count,
                RemindersCreated = dayReminders.Count
            });
        }

        return rows;
    }

    private static AdminUserBehaviorItem BuildUserItem(
        UserBehaviorUserReadModel user,
        DateTime fromUtc,
        DateTime toExclusiveUtc,
        IReadOnlyCollection<UserBehaviorPetReadModel> pets,
        IReadOnlyCollection<UserBehaviorSessionReadModel> sessions,
        IReadOnlyCollection<UserBehaviorMessageReadModel> ownerMessages,
        IReadOnlyCollection<UserBehaviorMessageReadModel> aiResponses,
        IReadOnlyCollection<UserBehaviorMedicalNoteReadModel> medicalNotes,
        IReadOnlyCollection<UserBehaviorReminderReadModel> reminders)
    {
        var userPets = pets.Where(pet => pet.UserId == user.UserId).ToList();
        var petsCreatedInRange = userPets.Where(pet => IsInRange(pet.CreatedAt, fromUtc, toExclusiveUtc)).ToList();
        var userSessions = sessions.Where(session => session.UserId == user.UserId).ToList();
        var userOwnerMessages = ownerMessages.Where(message => message.UserId == user.UserId).ToList();
        var userAiResponses = aiResponses.Where(message => message.UserId == user.UserId).ToList();
        var userMedicalNotes = medicalNotes.Where(note => note.UserId == user.UserId).ToList();
        var userReminders = reminders.Where(reminder => reminder.UserId == user.UserId).ToList();
        var activityTimes = userSessions.Select(session => session.CreatedAt)
            .Concat(userOwnerMessages.Select(message => message.CreatedAt))
            .Concat(userMedicalNotes.Select(note => note.CreatedAt))
            .Concat(userReminders.Select(reminder => reminder.CreatedAt))
            .Concat(petsCreatedInRange.Select(pet => pet.CreatedAt))
            .ToList();

        var activeDays = activityTimes.Select(value => value.Date).Distinct().Count();
        var hasPet = userPets.Count > 0;
        var usedService = userOwnerMessages.Count + userMedicalNotes.Count + userReminders.Count > 0;
        var featuresUsed = new[]
        {
            hasPet,
            userOwnerMessages.Count > 0,
            userMedicalNotes.Count > 0,
            userReminders.Count > 0
        }.Count(value => value);
        var totalActions = petsCreatedInRange.Count + userSessions.Count + userOwnerMessages.Count +
                           userMedicalNotes.Count + userReminders.Count;
        var engagementScore = Math.Min(100,
            Math.Min(35, activeDays * 7) +
            Math.Min(25, userOwnerMessages.Count * 2) +
            Math.Min(30, featuresUsed * 10) +
            (hasPet ? 10 : 0));
        var segment = ResolveSegment(totalActions, activeDays, featuresUsed, hasPet, usedService);

        return new AdminUserBehaviorItem
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            IsSynthetic = user.IsSynthetic,
            AccountCreatedAt = user.CreatedAt.ToString("O"),
            PetNames = userPets.Select(pet => pet.Name).Distinct().OrderBy(name => name).ToList(),
            ActiveDays = activeDays,
            Sessions = userSessions.Count,
            Conversations = userOwnerMessages.Select(message => message.ConversationId).Distinct().Count(),
            OwnerMessages = userOwnerMessages.Count,
            AiResponses = userAiResponses.Count,
            MedicalNotes = userMedicalNotes.Count,
            RemindersCreated = userReminders.Count,
            FeaturesUsed = featuresUsed,
            TotalActions = totalActions,
            EngagementScore = engagementScore,
            Segment = segment.Key,
            SegmentLabel = segment.Label,
            FirstActivityAt = activityTimes.Count == 0 ? null : activityTimes.Min().ToString("O"),
            LastActivityAt = activityTimes.Count == 0 ? null : activityTimes.Max().ToString("O"),
            HasPet = hasPet,
            UsedServiceInRange = usedService,
            IsReturning = activeDays >= 2
        };
    }

    private static List<AdminBehaviorFunnelItem> BuildFunnel(IReadOnlyCollection<AdminUserBehaviorItem> users)
    {
        var registered = users.Count;
        var petOwners = users.Count(user => user.HasPet);
        var activated = users.Count(user => user.HasPet && user.UsedServiceInRange);
        var returning = users.Count(user => user.HasPet && user.UsedServiceInRange && user.IsReturning);

        return new List<AdminBehaviorFunnelItem>
        {
            FunnelItem("registered", "Tài khoản chủ nuôi", "Đã đăng ký trước khi kỳ phân tích kết thúc.", registered, registered, registered),
            FunnelItem("pet", "Có hồ sơ thú cưng", "Đã tạo ít nhất một hồ sơ pet.", petOwners, registered, registered),
            FunnelItem("activated", "Dùng tính năng cốt lõi", "Có pet và đã dùng chat, ghi chú hoặc nhắc lịch trong kỳ.", activated, petOwners, petOwners),
            FunnelItem("returning", "Quay lại sử dụng", "Hoạt động từ hai ngày khác nhau trở lên.", returning, activated, activated)
        };
    }

    private static AdminBehaviorFunnelItem FunnelItem(
        string key,
        string label,
        string description,
        int users,
        int previousUsers,
        int denominator) => new()
    {
        Key = key,
        Label = label,
        Description = description,
        Users = users,
        DropOffUsers = Math.Max(0, previousUsers - users),
        ConversionRate = Percentage(users, denominator)
    };

    private static List<AdminFeatureAdoptionItem> BuildFeatureAdoption(
        IReadOnlyCollection<AdminUserBehaviorItem> users,
        int petsCreated,
        int ownerMessages,
        int medicalNotes,
        int reminders,
        int activeUsers) =>
    [
        FeatureItem("pet", "Hồ sơ thú cưng", "Người dùng đang có ít nhất một pet.", users.Count(user => user.HasPet), petsCreated, users.Count),
        FeatureItem("chat", "Chat AI", "Người dùng đã gửi câu hỏi cho trợ lý AI.", users.Count(user => user.OwnerMessages > 0), ownerMessages, activeUsers),
        FeatureItem("medical", "Ghi chú sức khỏe", "Người dùng đã tạo ghi chú y tế cho pet.", users.Count(user => user.MedicalNotes > 0), medicalNotes, activeUsers),
        FeatureItem("reminder", "Nhắc lịch", "Người dùng đã tạo lịch nhắc chăm sóc.", users.Count(user => user.RemindersCreated > 0), reminders, activeUsers)
    ];

    private static AdminFeatureAdoptionItem FeatureItem(
        string key,
        string label,
        string description,
        int users,
        int events,
        int denominator) => new()
    {
        Key = key,
        Label = label,
        Description = description,
        Users = users,
        Events = events,
        AdoptionRate = Percentage(users, denominator)
    };

    private static List<AdminUserSegmentItem> BuildSegments(IReadOnlyCollection<AdminUserBehaviorItem> users)
    {
        var definitions = new[]
        {
            (Key: "champion", Label: "Gắn bó cao", Description: "Dùng nhiều tính năng và hoạt động ít nhất 5 ngày."),
            (Key: "returning", Label: "Đang quay lại", Description: "Có hoạt động từ 2 ngày khác nhau."),
            (Key: "activated", Label: "Vừa kích hoạt", Description: "Đã có pet và dùng tính năng cốt lõi."),
            (Key: "exploring", Label: "Đang khám phá", Description: "Có hoạt động nhưng chưa hình thành thói quen."),
            (Key: "dormant", Label: "Chưa hoạt động", Description: "Không có hành vi trong kỳ phân tích.")
        };

        return definitions.Select(definition =>
        {
            var count = users.Count(user => user.Segment == definition.Key);
            return new AdminUserSegmentItem
            {
                Key = definition.Key,
                Label = definition.Label,
                Description = definition.Description,
                Users = count,
                Percentage = Percentage(count, users.Count)
            };
        }).ToList();
    }

    private static List<AdminBehaviorInsightItem> BuildInsights(
        AdminUserBehaviorSummary summary,
        IReadOnlyCollection<AdminFeatureAdoptionItem> features)
    {
        var insights = new List<AdminBehaviorInsightItem>();

        insights.Add(summary.ActivationRate < 50
            ? new AdminBehaviorInsightItem
            {
                Severity = "warning",
                Title = "Onboarding đang mất người dùng trước điểm kích hoạt",
                Description = $"Chỉ {summary.ActivationRate:0.#}% tài khoản vừa có pet vừa dùng một tính năng cốt lõi trong kỳ.",
                RecommendedAction = "Rút ngắn luồng tạo pet và đặt CTA chat AI / nhắc lịch ngay sau khi hoàn tất hồ sơ.",
                Metric = $"{summary.ActivatedUsers}/{summary.UsersInDataset} đã kích hoạt"
            }
            : new AdminBehaviorInsightItem
            {
                Severity = "positive",
                Title = "Tỷ lệ kích hoạt đang ở mức tốt",
                Description = $"{summary.ActivationRate:0.#}% tài khoản đã đi qua điểm giá trị cốt lõi của sản phẩm.",
                RecommendedAction = "Giữ luồng onboarding hiện tại và thử tối ưu bước đưa người dùng quay lại.",
                Metric = $"{summary.ActivatedUsers} người dùng đã kích hoạt"
            });

        var serviceFeatures = features.Where(feature => feature.Key != "pet").ToList();
        var weakestFeature = serviceFeatures.OrderBy(feature => feature.AdoptionRate).FirstOrDefault();
        if (weakestFeature != null)
        {
            insights.Add(new AdminBehaviorInsightItem
            {
                Severity = weakestFeature.AdoptionRate < 25 ? "warning" : "opportunity",
                Title = $"{weakestFeature.Label} là tính năng có adoption thấp nhất",
                Description = $"{weakestFeature.Users} người dùng, tương đương {weakestFeature.AdoptionRate:0.#}% người dùng hoạt động, đã sử dụng tính năng này.",
                RecommendedAction = $"Đưa {weakestFeature.Label.ToLowerInvariant()} vào CTA sau khi tạo pet và phỏng vấn nhóm chưa sử dụng để tìm điểm vướng.",
                Metric = $"{weakestFeature.Events} lượt sử dụng"
            });
        }

        insights.Add(summary.ReturnRate < 35
            ? new AdminBehaviorInsightItem
            {
                Severity = "warning",
                Title = "Tỷ lệ quay lại cần được ưu tiên",
                Description = $"{summary.ReturnRate:0.#}% người dùng hoạt động quay lại ở một ngày khác trong kỳ.",
                RecommendedAction = "Tạo reminder mẫu, thông báo có giá trị và nội dung follow-up sau lần dùng đầu tiên.",
                Metric = $"{summary.ReturningUsers}/{Math.Max(summary.ActiveUsers, 1)} quay lại"
            }
            : new AdminBehaviorInsightItem
            {
                Severity = "positive",
                Title = "Người dùng có tín hiệu hình thành thói quen",
                Description = $"{summary.ReturnRate:0.#}% người dùng hoạt động đã quay lại ít nhất một ngày khác.",
                RecommendedAction = "Phân tích nhóm gắn bó cao để nhân rộng hành trình và CTA họ đang sử dụng.",
                Metric = $"{summary.ReturningUsers} người dùng quay lại"
            });

        if (summary.DormantUsers > 0)
        {
            insights.Add(new AdminBehaviorInsightItem
            {
                Severity = "opportunity",
                Title = "Có nhóm tài khoản chưa tạo ra hành vi",
                Description = $"{summary.DormantUsers} tài khoản không có session hoặc thao tác sản phẩm trong khoảng thời gian đã chọn.",
                RecommendedAction = "Tách nhóm theo đã/chưa có pet và gửi lời mời quay lại phù hợp với trạng thái onboarding.",
                Metric = $"{Percentage(summary.DormantUsers, summary.UsersInDataset):0.#}% chưa hoạt động"
            });
        }

        return insights.Take(4).ToList();
    }

    private static (string Key, string Label) ResolveSegment(
        int totalActions,
        int activeDays,
        int featuresUsed,
        bool hasPet,
        bool usedService)
    {
        if (totalActions == 0) return ("dormant", "Chưa hoạt động");
        if (activeDays >= 5 && featuresUsed >= 3) return ("champion", "Gắn bó cao");
        if (activeDays >= 2) return ("returning", "Đang quay lại");
        if (hasPet && usedService) return ("activated", "Vừa kích hoạt");
        return ("exploring", "Đang khám phá");
    }

    private static string NormalizeQuestion(string content) =>
        string.Join(" ", content
            .Trim()
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    private static string NormalizeIntent(string? intent) =>
        string.IsNullOrWhiteSpace(intent) ? "general" : intent.Trim().ToLowerInvariant();

    private static string IntentLabel(string intent) => intent switch
    {
        "nutrition" => "Dinh dưỡng",
        "symptom" => "Triệu chứng",
        "vaccine" => "Tiêm phòng",
        "emergency" => "Khẩn cấp",
        "appointment" => "Đặt lịch",
        "billing" => "Thanh toán",
        "grooming" => "Chăm sóc vệ sinh",
        "training" => "Huấn luyện",
        "behavior" => "Hành vi thú cưng",
        "product" => "Sản phẩm",
        _ => "Tư vấn chung"
    };

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : $"{value[..(maxLength - 1)]}…";

    private static decimal Percentage(int numerator, int denominator) =>
        denominator <= 0 ? 0 : Math.Round((decimal)numerator / denominator * 100, 1);

    private static bool IsInRange(DateTime value, DateTime fromUtc, DateTime toExclusiveUtc) =>
        value >= fromUtc && value < toExclusiveUtc;

    private static bool IsOwnerMessage(string senderRole) =>
        string.Equals(senderRole, "user", StringComparison.OrdinalIgnoreCase);

    private static bool IsAiMessage(string senderRole) =>
        string.Equals(senderRole, "assistant", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(senderRole, "AI", StringComparison.OrdinalIgnoreCase);
}
