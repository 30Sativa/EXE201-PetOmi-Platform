using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtService _jwtService;
        private readonly ITokenGenerator _tokenGenerator;
        private readonly IUserSessionRepository _userSession;
        private readonly IUserDeviceRepository _userDeviceRepository;

        public LoginCommandHandler(
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            IJwtService jwtService,
            ITokenGenerator tokenGenerator, 
            IUserSessionRepository userSessionRepository,
            IUserDeviceRepository userDeviceRepository)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _jwtService = jwtService;
            _tokenGenerator = tokenGenerator;
            _userSession = userSessionRepository;
            _userDeviceRepository = userDeviceRepository;
        }
        public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            // 1. Find user
            var user = await _userRepository.GetByEmailAsync(new Email(request.Request.Email))
                ?? throw new NotFoundException("User không tồn tại");

            // 2. Validate login — domain xử lý
            user.ValidateLogin(request.Request.Password, _passwordHasher);
            
            // 3. find or create device
            var device = await _userDeviceRepository.GetByFingerprintAsync(user.Id, request.Request.DeviceFingerprint);

            if(device != null)
            {
                // check block
                device.EnsureNotBlocked();
                device.UpdateLastLogin(request.Request.UserAgent);
                await _userDeviceRepository.UpdateAsync(device);
            }
            else
            {
                //create new device
                device = UserDeviceDomain.Create(userId: user.Id, deviceName: request.Request.DeviceName, deviceType: request.Request.DeviceType, deviceFingerprint: request.Request.DeviceFingerprint, userAgent: request.Request.UserAgent);

                await _userDeviceRepository.AddAsync(device);
                 await _unitOfWork.SaveChangesAsync(cancellationToken); // save device trước để có Id
            }

            // 4. Find or Create session theo deviceId
            var session = await _userSession.GetByUserAndDeviceAsync(user.Id, device.Id);

            if (session != null)
            {
                // Revoke token cũ nếu có
                if (session.RefreshTokenId.HasValue)
                {
                    var oldToken = await _refreshTokenRepository.GetByIdAsync(session.RefreshTokenId.Value);
                    oldToken?.Revoke();
                    if (oldToken != null)
                        await _refreshTokenRepository.UpdateAsync(oldToken);
                }
            }
            else
            {
                // Tạo session mới
                session = UserSessionDomain.Create(user.Id, device.Id);
                await _userSession.AddAsync(session);
                await _unitOfWork.SaveChangesAsync(cancellationToken); // ← save session trước để có Id
            }

            // 4. Tạo refresh token mới
            var refreshTokenRaw = _tokenGenerator.GenerateRefreshToken();
            var refreshTokenHash = _tokenGenerator.HashToken(refreshTokenRaw);


            var refreshToken = RefreshTokensDomain.Create(
                userId: user.Id,
                tokenHash: refreshTokenHash,
                deviceId: device.Id,                     
                createdByIp: request.Request.IpAddress,  
                userAgent: request.Request.UserAgent     
                );
            await _refreshTokenRepository.AddAsync(refreshToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken); //  save token để có Id

            // 5. Gắn token vào session
            session.AssignToken(refreshToken.Id);
            await _userSession.UpdateAsync(session);

            // 6. Update user last login
            await _userRepository.UpdateAsync(user);

            // 7. Save tất cả
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 8. Generate access token
            var accessToken = _jwtService.GenerateToken(user);

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenRaw,
                UserId = user.Id,
                Email = user.Email.Value
            };
        }
    }
}
