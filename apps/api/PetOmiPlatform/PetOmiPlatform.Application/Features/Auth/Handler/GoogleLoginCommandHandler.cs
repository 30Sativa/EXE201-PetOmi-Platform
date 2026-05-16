using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, LoginResponse>
    {
        private readonly IGoogleAuthService _googleAuthService;
        private readonly IUserRepository _userRepository;
        private readonly IExternalLoginRepository _externalLoginRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IJwtService _jwtService;
        private readonly IUnitOfWork _unitOfWork;

        public GoogleLoginCommandHandler(
            IGoogleAuthService googleAuthService,
            IUserRepository userRepository,
            IExternalLoginRepository externalLoginRepository,
            IUserRoleRepository userRoleRepository,
            IJwtService jwtService,
            IUnitOfWork unitOfWork)
        {
            _googleAuthService = googleAuthService;
            _userRepository = userRepository;
            _externalLoginRepository = externalLoginRepository;
            _userRoleRepository = userRoleRepository;
            _jwtService = jwtService;
            _unitOfWork = unitOfWork;
        }

        public async Task<LoginResponse> Handle(
            GoogleLoginCommand command,
            CancellationToken cancellationToken)
        {
            // 1. Lấy thông tin user từ Google
            var googleUser = await _googleAuthService.GetUserInfoAsync(command.AccessToken);

            // 2. Check ExternalLogin đã tồn tại chưa
            var existingUserId = await _externalLoginRepository
                .GetUserIdByProviderAsync("Google", googleUser.ProviderKey);

            UserDomain user;

            if (existingUserId.HasValue)
            {
                // 3a. Đã có → load user lên
                user = await _userRepository.GetByIdAsync(existingUserId.Value)
                    ?? throw new NotFoundException("Không tìm thấy tài khoản.");
            }
            else
            {
                // 3b. Chưa có → tạo User mới
                var email = new Email(googleUser.Email);

                // Kiểm tra email đã tồn tại chưa (user đã register bằng password)
                var existingUser = await _userRepository.GetByNormalizedEmail(email.NormalizedValue);

                if (existingUser != null)
                {
                    // Email đã tồn tại → link ExternalLogin vào account cũ
                    user = existingUser;
                }
                else
                {
                    // Tạo user mới — không có password (OAuth user)
                    user = UserDomain.CreateWithoutPassword(email);
                    await _userRepository.AddAsync(user);

                    // Auto gán Role Owner
                    await _userRoleRepository.AddAsync(user.Id, RoleConstants.OwnerId);
                }

                // Lưu ExternalLogin
                await _externalLoginRepository.AddAsync(
                    userId: user.Id,
                    provider: "Google",
                    providerKey: googleUser.ProviderKey,
                    email: googleUser.Email
                );

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            // 4. Generate JWT
            var token = _jwtService.GenerateTokenWithRole(user, RoleConstants.Owner);

            return new LoginResponse
            {
                AccessToken = token,
                UserId = user.Id,
                Email = user.Email.Value
            };
        }
    }
}
