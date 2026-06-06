using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Features.Admin.Queries;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public class GetAdminUsersQueryHandler : IRequestHandler<GetAdminUsersQuery, PagedData<AdminUserListResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUserProfileRepository _userProfileRepository;

    public GetAdminUsersQueryHandler(
        IUserRepository userRepository,
        IUserRoleRepository userRoleRepository,
        IUserProfileRepository userProfileRepository)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _userProfileRepository = userProfileRepository;
    }

    public async Task<PagedData<AdminUserListResponse>> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var (users, total) = await _userRepository.GetAdminPagedAsync(
            request.Search, request.IsActive, request.Role, request.Page, request.PageSize);

        var items = new List<AdminUserListResponse>();

        foreach (var user in users)
        {
            var roles = await _userRoleRepository.GetRolesByUserIdAsync(user.Id);
            var profile = await _userProfileRepository.GetByUserIdAsync(user.Id);

            items.Add(new AdminUserListResponse
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

        return new PagedData<AdminUserListResponse>
        {
            Items = items,
            Meta = new PaginationMeta<AdminUserListResponse>
            {
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalRecords = total
            }
        };
    }
}
