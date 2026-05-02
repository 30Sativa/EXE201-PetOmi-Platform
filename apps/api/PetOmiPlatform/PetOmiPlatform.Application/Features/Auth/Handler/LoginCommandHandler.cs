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

        public LoginCommandHandler(
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            IJwtService jwtService,
            ITokenGenerator tokenGenerator, 
            IUserSessionRepository userSessionRepository)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _jwtService = jwtService;
            _tokenGenerator = tokenGenerator;
            _userSession = userSessionRepository;
        }
        public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            // 1. Find user
            var user = await _userRepository.GetByEmailAsync(new Email(request.Request.Email))
                ?? throw new NotFoundException("User không tồn tại");

            // 2. Validate login — domain xử lý
            user.ValidateLogin(request.Request.Password, _passwordHasher);

            // 3. Find or Create session theo deviceId
            var session = await _userSession.GetByUserAndDeviceAsync(user.Id, request.Request.DeviceId);

            if (session != null)
            {
                // Revoke token cũ nếu có
                if (session.RefreshTokenId.HasValue)
                {
                    var oldToken = await _refreshTokenRepository.GetByTokenHashAsync(
                        session.RefreshTokenId.Value.ToString());
                    oldToken?.Revoke();
                    if (oldToken != null)
                        await _refreshTokenRepository.UpdateAsync(oldToken);
                }
            }
            else
            {
                // Tạo session mới
                session = UserSessionDomain.Create(user.Id, request.Request.DeviceId);
                await _userSession.AddAsync(session);
                await _unitOfWork.SaveChangesAsync(cancellationToken); // ← save session trước để có Id
            }

            // 4. Tạo refresh token mới
            var refreshTokenRaw = _tokenGenerator.GenerateRefreshToken();
            var refreshTokenHash = _tokenGenerator.HashToken(refreshTokenRaw);
            var refreshToken = RefreshTokensDomain.Create(user.Id, refreshTokenHash);
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
