using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth;
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
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUserSessionRepository _userSessionRepository;
        private readonly IUserDeviceRepository _userDeviceRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IJwtService _jwtService;
        private readonly ITokenGenerator _tokenGenerator;
        private readonly IUnitOfWork _unitOfWork;

        public GoogleLoginCommandHandler(
            IGoogleAuthService googleAuthService,
            IUserRepository userRepository,
            IExternalLoginRepository externalLoginRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IUserSessionRepository userSessionRepository,
            IUserDeviceRepository userDeviceRepository,
            IUserRoleRepository userRoleRepository,
            IJwtService jwtService,
            ITokenGenerator tokenGenerator,
            IUnitOfWork unitOfWork)
        {
            _googleAuthService = googleAuthService;
            _userRepository = userRepository;
            _externalLoginRepository = externalLoginRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _userSessionRepository = userSessionRepository;
            _userDeviceRepository = userDeviceRepository;
            _userRoleRepository = userRoleRepository;
            _jwtService = jwtService;
            _tokenGenerator = tokenGenerator;
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
            var requiresPasswordSetup = false;

            if (existingUserId.HasValue)
            {
                // 3a. Đã có → load user lên
                user = await _userRepository.GetByIdAsync(existingUserId.Value)
                    ?? throw new NotFoundException("Không tìm thấy tài khoản.");
                requiresPasswordSetup = !user.HasPassword;
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
                    requiresPasswordSetup = !user.HasPassword;
                }
                else
                {
                    // Tạo user mới — không có password (OAuth user)
                    user = UserDomain.CreateWithoutPassword(email);
                    await _userRepository.AddAsync(user);
                    requiresPasswordSetup = true;

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

            var userAgent = string.IsNullOrWhiteSpace(command.UserAgent)
                ? "Unknown"
                : command.UserAgent;
            // Bao gồm user.Id để tránh va chạm fingerprint giữa các user cùng IP/UA
            var deviceFingerprint = "google-oauth:" + _tokenGenerator.HashToken(
                $"{user.Id}:{userAgent}|{command.IpAddress ?? "unknown"}");

            var device = await _userDeviceRepository.GetByFingerprintAsync(user.Id, deviceFingerprint);

            if (device != null)
            {
                device.EnsureNotBlocked();
                device.UpdateLastLogin(userAgent);
                await _userDeviceRepository.UpdateAsync(device);
            }
            else
            {
                device = UserDeviceDomain.Create(
                    userId: user.Id,
                    deviceName: "Google OAuth",
                    deviceType: "web",
                    deviceFingerprint: deviceFingerprint,
                    userAgent: userAgent);

                await _userDeviceRepository.AddAsync(device);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            var session = await _userSessionRepository.GetByUserAndDeviceAsync(user.Id, device.Id);

            if (session != null)
            {
                if (session.RefreshTokenId.HasValue)
                {
                    var oldToken = await _refreshTokenRepository.GetByIdAsync(session.RefreshTokenId.Value);
                    oldToken?.Revoke();
                    if (oldToken != null)
                    {
                        await _refreshTokenRepository.UpdateAsync(oldToken);
                    }
                }
            }
            else
            {
                session = UserSessionDomain.Create(user.Id, device.Id);
                await _userSessionRepository.AddAsync(session);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            var refreshTokenRaw = _tokenGenerator.GenerateRefreshToken();
            var refreshTokenHash = _tokenGenerator.HashToken(refreshTokenRaw);
            var refreshToken = RefreshTokensDomain.Create(
                userId: user.Id,
                tokenHash: refreshTokenHash,
                deviceId: device.Id,
                createdByIp: command.IpAddress,
                userAgent: userAgent);

            await _refreshTokenRepository.AddAsync(refreshToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            session.AssignToken(refreshToken.Id);
            await _userSessionRepository.UpdateAsync(session);
            await _userRepository.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 4. Generate JWT
            var roles = await _userRoleRepository.GetRolesByUserIdAsync(user.Id);
            var activeRole = AuthRoleResolver.ResolveDefaultActiveRole(roles);
            var token = _jwtService.GenerateTokenWithRole(user, activeRole);

            return new LoginResponse
            {
                AccessToken = token,
                RefreshToken = refreshTokenRaw,
                ActiveRole = activeRole,
                Roles = roles,
                UserId = user.Id,
                Email = user.Email.Value,
                IsProfileCompleted = user.IsProfileCompleted,
                RequiresPasswordSetup = requiresPasswordSetup
            };
        }
    }
}
