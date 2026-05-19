using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.UserProfile.Query;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.UserProfile.Handler
{
    public class GetUserProfileHandler : IRequestHandler<GetUserProfileQuery, UserProfileResponse>
    {
        private readonly IUserProfileRepository _profileRepository;

        public GetUserProfileHandler(IUserProfileRepository profileRepository)
        {
            _profileRepository = profileRepository;
        }

        public async Task<UserProfileResponse> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
        {
            var profile = await _profileRepository.GetByUserIdAsync(request.UserId)
                ?? throw new NotFoundException("Hồ sơ người dùng không tìm thấy.");

            return new UserProfileResponse
            {
                ProfileId = profile.Id,
                UserId = profile.UserId,
                FullName = profile.FullName,
                Phone = profile.Phone,
                AvatarUrl = profile.AvatarUrl,
                DateOfBirth = profile.DateOfBirth,
                Gender = profile.Gender,
                Address = profile.Address,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt
            };
        }
    }
}
