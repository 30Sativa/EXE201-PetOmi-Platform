using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Admin.Commands;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public class AssignAdminRoleCommandHandler : IRequestHandler<AssignAdminRoleCommand, AdminUserListResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUserProfileRepository _userProfileRepository;
    private readonly IUnitOfWork _unitOfWork;
    private static readonly Guid AdminRoleId = Guid.Parse("11111111-0000-0000-0000-000000000002");

    public AssignAdminRoleCommandHandler(
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

    public async Task<AdminUserListResponse> Handle(AssignAdminRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.TargetUserId)
            ?? throw new NotFoundException("User khong ton tai.");

        await _userRoleRepository.AddIfNotExistsAsync(request.TargetUserId, AdminRoleId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var roles = await _userRoleRepository.GetRolesByUserIdAsync(request.TargetUserId);
        var profile = await _userProfileRepository.GetByUserIdAsync(request.TargetUserId);

        return new AdminUserListResponse
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
        };
    }
}
