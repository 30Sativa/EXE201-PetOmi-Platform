using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.UserProfile.Command;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.UserProfile.Handler
{
    public class CreateUserProfileCommandHandler : IRequestHandler<CreateUserProfileCommand, UserProfileResponse>
    {
        private readonly IUserProfileRepository _profileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateUserProfileCommandHandler(
            IUserProfileRepository profileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _profileRepository = profileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<UserProfileResponse> Handle(CreateUserProfileCommand request, CancellationToken cancellationToken)
        {
            var existingProfile = await _profileRepository.GetByUserIdAsync(request.UserId);
            if (existingProfile != null)
                throw new ConflictException("Hồ sơ người dùng đã tồn tại.");

            var profile = UserProfileDomain.Create(
                userId: request.UserId,
                fullName: request.Request.FullName,
                phone: request.Request.Phone,
                avatarUrl: request.Request.AvatarUrl,
                dateOfBirth: request.Request.DateOfBirth,
                gender: request.Request.Gender,
                address: request.Request.Address
            );

            await _profileRepository.AddAsync(profile);
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
