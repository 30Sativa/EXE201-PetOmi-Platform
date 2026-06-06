using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, VerifyEmailResponse>
    {
        private readonly IEmailVerificationTokenRepository _tokenRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenGenerator _tokenGenerator;
        private readonly IJwtService _jwtService;
        private readonly IUserSessionRepository _userSessionRepository;
        private readonly IUserDeviceRepository _userDeviceRepository;
        private readonly IUserRoleRepository _userRoleRepository;

        public VerifyEmailCommandHandler(
            IEmailVerificationTokenRepository tokenRepository,
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IUnitOfWork unitOfWork,
            ITokenGenerator tokenGenerator,
            IJwtService jwtService,
            IUserSessionRepository userSessionRepository,
            IUserDeviceRepository userDeviceRepository,
            IUserRoleRepository userRoleRepository)
        {
            _tokenRepository = tokenRepository;
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _unitOfWork = unitOfWork;
            _tokenGenerator = tokenGenerator;
            _jwtService = jwtService;
            _userSessionRepository = userSessionRepository;
            _userDeviceRepository = userDeviceRepository;
            _userRoleRepository = userRoleRepository;
        }

        public async Task<VerifyEmailResponse> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
        {
            var decodedToken = Uri.UnescapeDataString(request.Token);
            var hashToken = _tokenGenerator.HashToken(decodedToken);
            var token = await _tokenRepository.GetByTokenAsync(hashToken)
                ?? throw new NotFoundException("Token không hợp lệ.");

            token.EnsureValid();

            var user = await _userRepository.GetByIdAsync(token.UserId)
                ?? throw new NotFoundException("User không tồn tại.");

            user.VerifyEmail();
            token.MarkAsUsed();

            await _userRepository.UpdateAsync(user);
            await _tokenRepository.UpdateAsync(token);

            var device = UserDeviceDomain.Create(
                userId: user.Id,
                deviceName: "Email Verification",
                deviceType: "web",
                deviceFingerprint: $"email-verify-{Guid.NewGuid()}",
                userAgent: "Email Verification Flow"
            );
            await _userDeviceRepository.AddAsync(device);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var session = UserSessionDomain.Create(user.Id, device.Id);
            await _userSessionRepository.AddAsync(session);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var refreshTokenRaw = _tokenGenerator.GenerateRefreshToken();
            var refreshTokenHash = _tokenGenerator.HashToken(refreshTokenRaw);

            var refreshToken = RefreshTokensDomain.Create(
                userId: user.Id,
                tokenHash: refreshTokenHash,
                deviceId: device.Id,
                createdByIp: "127.0.0.1",
                userAgent: "Email Verification Flow"
            );
            await _refreshTokenRepository.AddAsync(refreshToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            session.AssignToken(refreshToken.Id);
            await _userSessionRepository.UpdateAsync(session);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var roles = await _userRoleRepository.GetRolesByUserIdAsync(user.Id);
            var activeRole = AuthRoleResolver.ResolveDefaultActiveRole(roles);
            var accessToken = _jwtService.GenerateTokenWithRole(user, activeRole);

            return new VerifyEmailResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenRaw,
                ActiveRole = activeRole,
                Roles = roles,
                Email = user.Email.Value,
                IsProfileCompleted = user.IsProfileCompleted,
                Message = user.IsProfileCompleted
                    ? "Xác minh email thành công."
                    : "Xác minh email thành công. Vui lòng hoàn thiện hồ sơ."
            };
        }
    }
}
