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
    public class CompleteUserProfileCommandHandler : IRequestHandler<CompleteUserProfileCommand, CompleteProfileResponse>
    {
        private readonly IUserProfileRepository _profileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CompleteUserProfileCommandHandler(
            IUserProfileRepository profileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _profileRepository = profileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<CompleteProfileResponse> Handle(CompleteUserProfileCommand request, CancellationToken cancellationToken)
        {
            var user = await _userRepository.GetByIdAsync(request.UserId)
                ?? throw new NotFoundException("Người dùng không tồn tại.");

            if (user.IsProfileCompleted)
                throw new ConflictException("Hồ sơ đã được hoàn thiện trước đó.");

            var existingProfile = await _profileRepository.GetByUserIdAsync(request.UserId);
            if (existingProfile != null)
            {
                existingProfile.Update(
                    fullName: request.Request.FullName,
                    phone: request.Request.Phone,
                    avatarUrl: request.Request.AvatarUrl,
                    avatarCloudinaryPublicId: request.Request.AvatarCloudinaryPublicId,
                    dateOfBirth: request.Request.DateOfBirth,
                    gender: request.Request.Gender,
                    address: request.Request.Address
                );
                await _profileRepository.UpdateAsync(existingProfile);
            }
            else
            {
                var profile = UserProfileDomain.Create(
                    userId: request.UserId,
                    fullName: request.Request.FullName,
                    phone: request.Request.Phone,
                    avatarUrl: request.Request.AvatarUrl,
                    avatarCloudinaryPublicId: request.Request.AvatarCloudinaryPublicId,
                    dateOfBirth: request.Request.DateOfBirth,
                    gender: request.Request.Gender,
                    address: request.Request.Address
                );
                await _profileRepository.AddAsync(profile);
            }

            user.CompleteProfile();
            await _userRepository.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new CompleteProfileResponse
            {
                ProfileId = existingProfile?.Id ?? Guid.Empty,
                UserId = request.UserId,
                FullName = request.Request.FullName,
                Phone = request.Request.Phone,
                DateOfBirth = request.Request.DateOfBirth,
                Gender = request.Request.Gender,
                Address = request.Request.Address,
                IsProfileCompleted = true
            };
        }
    }
}
