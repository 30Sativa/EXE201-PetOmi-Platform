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

    public GetAdminDashboardQueryHandler(
        IClinicRepository clinicRepository,
        IUserRepository userRepository,
        IAppointmentRepository appointmentRepository)
    {
        _clinicRepository = clinicRepository;
        _userRepository = userRepository;
        _appointmentRepository = appointmentRepository;
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
            ClinicTrend = clinicTrend.Select(kv => new ClinicTrendItem { Date = kv.Key, Count = kv.Value }).ToList(),
            UserTrend = userTrend.Select(kv => new UserTrendItem { Date = kv.Key, Count = kv.Value }).ToList()
        };
    }
}
