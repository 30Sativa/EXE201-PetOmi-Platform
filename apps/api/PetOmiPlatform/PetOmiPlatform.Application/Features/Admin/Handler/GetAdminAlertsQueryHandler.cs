using MediatR;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Features.Admin.Queries;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public class GetAdminAlertsQueryHandler : IRequestHandler<GetAdminAlertsQuery, AdminAlertsResponse>
{
    private readonly IClinicRepository _clinicRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUserProfileRepository _userProfileRepository;

    public GetAdminAlertsQueryHandler(
        IClinicRepository clinicRepository,
        IUserRepository userRepository,
        IUserRoleRepository userRoleRepository,
        IUserProfileRepository userProfileRepository)
    {
        _clinicRepository = clinicRepository;
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _userProfileRepository = userProfileRepository;
    }

    public async Task<AdminAlertsResponse> Handle(GetAdminAlertsQuery request, CancellationToken cancellationToken)
    {
        var maxItems = Math.Clamp(request.MaxItems, 1, 100);

        var pendingClinics = (await _clinicRepository.GetByStatusAsync("Pending", 1, maxItems)).ToList();
        var (inactiveUsers, _) = await _userRepository.GetAdminPagedAsync(null, false, 1, maxItems);
        var (unverifiedCandidates, _) = await _userRepository.GetAdminPagedAsync(null, null, 1, Math.Max(maxItems * 4, 100));

        var inactiveUserDtos = await BuildUserDtosAsync(inactiveUsers);
        var unverifiedUsers = unverifiedCandidates.Where(u => !u.EmailVerified).Take(maxItems).ToList();
        var unverifiedUserDtos = await BuildUserDtosAsync(unverifiedUsers);

        var items = new List<AdminAlertItemResponse>();

        foreach (var clinic in pendingClinics)
        {
            items.Add(new AdminAlertItemResponse
            {
                AlertId = $"clinic-{clinic.Id}",
                Type = "pending_clinic",
                Severity = "high",
                Title = $"Phong kham cho duyet: {clinic.ClinicName}",
                Description = clinic.Address ?? "Khong co dia chi",
                Timestamp = clinic.CreatedAt,
                Clinic = MapClinic(clinic)
            });
        }

        foreach (var user in inactiveUserDtos)
        {
            items.Add(new AdminAlertItemResponse
            {
                AlertId = $"inactive-{user.UserId}",
                Type = "inactive_user",
                Severity = "medium",
                Title = $"Tai khoan bi khoa: {user.FullName ?? user.Email}",
                Description = user.Email,
                Timestamp = user.CreatedAt,
                User = user
            });
        }

        foreach (var user in unverifiedUserDtos)
        {
            items.Add(new AdminAlertItemResponse
            {
                AlertId = $"unverified-{user.UserId}",
                Type = "unverified_user",
                Severity = "low",
                Title = $"Tai khoan chua xac thuc: {user.FullName ?? user.Email}",
                Description = user.Email,
                Timestamp = user.CreatedAt,
                User = user
            });
        }

        var highCount = await _clinicRepository.CountByStatusAsync("Pending");
        var mediumCount = await _userRepository.CountByIsActiveAsync(false);
        var lowCount = await _userRepository.CountByEmailVerifiedAsync(false);

        return new AdminAlertsResponse
        {
            Items = items
                .OrderBy(i => GetSeverityOrder(i.Severity))
                .ThenByDescending(i => i.Timestamp)
                .ToList(),
            Stats = new AdminAlertStatsResponse
            {
                High = highCount,
                Medium = mediumCount,
                Low = lowCount,
                Total = highCount + mediumCount + lowCount
            }
        };
    }

    private async Task<List<AdminUserListResponse>> BuildUserDtosAsync(IEnumerable<UserDomain> users)
    {
        var result = new List<AdminUserListResponse>();
        foreach (var user in users)
        {
            var roles = await _userRoleRepository.GetRolesByUserIdAsync(user.Id);
            var profile = await _userProfileRepository.GetByUserIdAsync(user.Id);

            result.Add(new AdminUserListResponse
            {
                UserId = user.Id,
                Email = user.Email.Value,
                FullName = profile?.FullName,
                EmailVerified = user.EmailVerified,
                IsActive = user.IsActive,
                IsProfileCompleted = user.IsProfileCompleted,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Roles = roles
            });
        }

        return result;
    }

    private static ClinicListItemResponse MapClinic(ClinicDomain clinic)
    {
        return new ClinicListItemResponse
        {
            ClinicId = clinic.Id,
            ClinicName = clinic.ClinicName,
            Address = clinic.Address,
            Phone = clinic.Phone,
            Email = clinic.Email,
            LicenseNumber = clinic.LicenseNumber,
            LicenseImageUrl = clinic.LicenseImageUrl,
            LicenseCloudinaryPublicId = clinic.LicenseCloudinaryPublicId,
            Status = clinic.Status.ToString(),
            RejectedReason = clinic.RejectedReason,
            CreatedAt = clinic.CreatedAt
        };
    }

    private static int GetSeverityOrder(string severity)
    {
        return severity switch
        {
            "high" => 0,
            "medium" => 1,
            _ => 2
        };
    }
}
