using MediatR;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Features.Admin.Queries;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public class GetAdminDashboardQueryHandler : IRequestHandler<GetAdminDashboardQuery, AdminDashboardResponse>
{
    private readonly IClinicRepository _clinicRepository;
    private readonly IUserRepository _userRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IChatMessageRepository _chatMessageRepository;

    public GetAdminDashboardQueryHandler(
        IClinicRepository clinicRepository,
        IUserRepository userRepository,
        IAppointmentRepository appointmentRepository,
        IChatMessageRepository chatMessageRepository)
    {
        _clinicRepository = clinicRepository;
        _userRepository = userRepository;
        _appointmentRepository = appointmentRepository;
        _chatMessageRepository = chatMessageRepository;
    }

    public async Task<AdminDashboardResponse> Handle(GetAdminDashboardQuery request, CancellationToken cancellationToken)
    {
        var totalUsers = await _userRepository.CountAllAsync();
        var activeUsers = await _userRepository.CountByIsActiveAsync(true);
        var inactiveUsers = await _userRepository.CountByIsActiveAsync(false);

        var clinicByStatus = await _clinicRepository.GetClinicCountByStatusAsync();
        clinicByStatus.TryGetValue("Pending", out var pending);
        clinicByStatus.TryGetValue("Approved", out var approved);
        clinicByStatus.TryGetValue("Rejected", out var rejected);
        var totalClinics = pending + approved + rejected;

        var clinicTrend = await _clinicRepository.GetClinicCreatedTrendAsync(30);
        var userTrend = await _userRepository.GetUserCreatedTrendAsync(30);

        var userCountByRole = await _userRepository.GetUserCountByRoleAsync();
        userCountByRole.TryGetValue("Owner", out var owners);
        userCountByRole.TryGetValue("Vet", out var vets);
        userCountByRole.TryGetValue("Admin", out var admins);

        var totalAppointments = await _appointmentRepository.CountAllAsync();
        var aiStatsWindowStartUtc = DateTime.UtcNow.AddDays(-7);
        var aiIntentWindowStartUtc = DateTime.UtcNow.AddDays(-30);
        var aiDashboardStats = await _chatMessageRepository.GetAiDashboardStatsAsync(aiStatsWindowStartUtc);
        var aiIntentStats = await _chatMessageRepository.GetIntentDashboardStatsAsync(aiIntentWindowStartUtc);
        var ragUsageRate = aiDashboardStats.AiResponsesSince == 0
            ? 0
            : Math.Round((decimal)aiDashboardStats.RagResponsesSince / aiDashboardStats.AiResponsesSince * 100, 1);

        return new AdminDashboardResponse
        {
            Summary = new AdminStatsSummary
            {
                TotalUsers = totalUsers,
                TotalClinics = totalClinics,
                TotalAppointments = totalAppointments,
                ActiveUsers = activeUsers,
                InactiveUsers = inactiveUsers
            },
            ClinicStats = new AdminClinicStats
            {
                Pending = pending,
                Approved = approved,
                Rejected = rejected,
                Total = totalClinics
            },
            UserStats = new AdminUserStats
            {
                Owners = owners,
                Vets = vets,
                Admins = admins
            },
            AiStats = new AdminAiStats
            {
                TotalAiResponses = aiDashboardStats.TotalAiResponses,
                AiResponsesLast7Days = aiDashboardStats.AiResponsesSince,
                RagResponses = aiDashboardStats.RagResponses,
                RagResponsesLast7Days = aiDashboardStats.RagResponsesSince,
                RagUsageRate = ragUsageRate,
                FailedResponsesLast7Days = aiDashboardStats.FailedResponsesSince,
                ActiveConversationsLast7Days = aiDashboardStats.ActiveConversationsSince,
                AverageChunksUsedLast7Days = aiDashboardStats.AverageChunksUsedSince,
                SourceBackedResponsesLast7Days = aiDashboardStats.SourceBackedResponsesSince,
                TotalTokensLast7Days = aiDashboardStats.TotalTokensSince
            },
            ClinicTrend = clinicTrend.Select(kv => new ClinicTrendItem { Date = kv.Key, Count = kv.Value }).ToList(),
            UserTrend = userTrend.Select(kv => new UserTrendItem { Date = kv.Key, Count = kv.Value }).ToList(),
            AiIntentStats = aiIntentStats.Select(item => new AiIntentStatItem
            {
                Intent = item.Intent,
                Count = item.Count,
                RagCount = item.RagCount
            }).ToList()
        };
    }
}
