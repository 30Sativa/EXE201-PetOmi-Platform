using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.UserProfile.Command;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.UserProfile.Handler
{
    public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand, UserProfileResponse>
    {
        private readonly IUserProfileRepository _profileRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateUserProfileCommandHandler(
            IUserProfileRepository profileRepository,
            IUnitOfWork unitOfWork)
        {
            _profileRepository = profileRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<UserProfileResponse> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
        {
            var profile = await _profileRepository.GetByUserIdAsync(request.UserId)
                ?? throw new NotFoundException("Hồ sơ người dùng không tìm thấy.");

            profile.Update(
                fullName: request.Request.FullName,
                phone: request.Request.Phone,
                avatarUrl: request.Request.AvatarUrl,
                dateOfBirth: request.Request.DateOfBirth,
                gender: request.Request.Gender,
                address: request.Request.Address
            );

            await _profileRepository.UpdateAsync(profile);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

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
