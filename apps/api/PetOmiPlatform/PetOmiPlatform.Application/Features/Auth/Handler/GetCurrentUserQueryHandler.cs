using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using PetOmiPlatform.Application.Features.Auth.Queries;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, GetCurrentUserResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IVetProfileRepository _vetProfileRepository;

        public GetCurrentUserQueryHandler(
            IUserRepository userRepository,
            IUserProfileRepository userProfileRepository,
            IUserRoleRepository userRoleRepository,
            IVetProfileRepository vetProfileRepository)
        {
            _userRepository = userRepository;
            _userProfileRepository = userProfileRepository;
            _userRoleRepository = userRoleRepository;
            _vetProfileRepository = vetProfileRepository;
        }

        public async Task<GetCurrentUserResponse> Handle(GetCurrentUserQuery query, CancellationToken cancellationToken)
        {
            var user = await _userRepository.GetByIdAsync(query.UserId)
                ?? throw new NotFoundException("User không tồn tại.");

            var profile = await _userProfileRepository.GetByUserIdAsync(query.UserId);

            var roles = await _userRoleRepository.GetRolesByUserIdAsync(query.UserId);

            var vetProfile = await _vetProfileRepository.GetByUserIdAsync(query.UserId);

            return new GetCurrentUserResponse
            {
                UserId = user.Id,
                Email = user.Email.Value,
                EmailVerified = user.EmailVerified,
                IsActive = user.IsActive,
                IsProfileCompleted = user.IsProfileCompleted,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Profile = profile != null
                    ? new UserProfileInfo
                    {
                        FullName = profile.FullName,
                        Phone = profile.Phone,
                        AvatarUrl = profile.AvatarUrl,
                        AvatarCloudinaryPublicId = profile.AvatarCloudinaryPublicId,
                        DateOfBirth = profile.DateOfBirth,
                        Gender = profile.Gender,
                        Address = profile.Address
                    }
                    : null,
                Roles = roles,
                VetProfile = vetProfile != null
                    ? new VetProfileInfo
                    {
                        VetProfileId = vetProfile.Id,
                        Specialization = vetProfile.Specialization,
                        LicenseNumber = vetProfile.LicenseNumber,
                        IsActive = vetProfile.IsActive
                    }
                    : null
            };
        }
    }
}
