using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Admin.Commands;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public class RevokeAdminRoleCommandHandler : IRequestHandler<RevokeAdminRoleCommand, AdminUserListResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUserProfileRepository _userProfileRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RevokeAdminRoleCommandHandler(
        IUserRepository userRepository,
        IUserRoleRepository userRoleRepository,
        IUserProfileRepository userProfileRepository,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _userProfileRepository = userProfileRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<AdminUserListResponse> Handle(
        RevokeAdminRoleCommand command,
        CancellationToken cancellationToken)
    {
        if (command.AdminId == command.TargetUserId)
            throw new BadRequestException("Ban khong the thu hoi quyen Admin cua chinh minh.");

        var targetUser = await _userRepository.GetByIdAsync(command.TargetUserId)
            ?? throw new NotFoundException("Khong tim thay tai khoan.");

        await _userRoleRepository.RemoveRoleAsync(command.TargetUserId, RoleConstants.AdminId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var roles = await _userRoleRepository.GetRolesByUserIdAsync(command.TargetUserId);
        var profile = await _userProfileRepository.GetByUserIdAsync(command.TargetUserId);

        return new AdminUserListResponse
        {
            UserId = targetUser.Id,
            Email = targetUser.Email.Value,
            FullName = profile?.FullName,
            EmailVerified = targetUser.EmailVerified,
            IsActive = targetUser.IsActive,
            IsProfileCompleted = targetUser.IsProfileCompleted,
            CreatedAt = targetUser.CreatedAt,
            LastLoginAt = targetUser.LastLoginAt,
            Roles = roles
        };
    }
}
