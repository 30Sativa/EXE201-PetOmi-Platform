using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, RefreshTokenResponse>
    {
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUserSessionRepository _sessionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly ITokenGenerator _tokenGenerator;

        public RefreshTokenCommandHandler(
            IRefreshTokenRepository refreshTokenRepository,
            IUserSessionRepository sessionRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IJwtService jwtService,
            ITokenGenerator tokenGenerator)
        {
            _refreshTokenRepository = refreshTokenRepository;
            _sessionRepository = sessionRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _tokenGenerator = tokenGenerator;
        }
        public async Task<RefreshTokenResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
        {
            // 1. Hash token → find
            var tokenHash = _tokenGenerator.HashToken(request.Request.RefreshToken);
            var token = await _refreshTokenRepository.GetByTokenHashAsync(tokenHash)
                ?? throw new UnauthorizedException("Token không hợp lệ.");

            // 2. Expired → reject
            if (token.IsExpired())
                throw new UnauthorizedException("Token đã hết hạn.");

            // 3. Revoked → check reuse attack
            if (token.IsRevoked)
            {
                if (token.ReplacedByTokenId != null)
                {
                    // Đổi tên thành attackedSessions để tránh trùng
                    var attackedSessions = await _sessionRepository.GetByRefreshTokenIdAsync(token.Id);
                    foreach (var s in attackedSessions)
                    {
                        s.Revoke();
                        await _sessionRepository.UpdateAsync(s);
                    }
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                    throw new UnauthorizedException("Phát hiện tấn công tái sử dụng token.");
                }
                throw new UnauthorizedException("Token đã bị thu hồi.");
            }

            // 4. Load session — đổi tên thành tokenSessions
            var tokenSessions = await _sessionRepository.GetByRefreshTokenIdAsync(token.Id);
            var session = tokenSessions.FirstOrDefault();

            if (session == null || !session.IsActive)
                throw new UnauthorizedException("Session không hợp lệ.");

            // 5. Load user
            var user = await _userRepository.GetByIdAsync(token.UserId)
                ?? throw new NotFoundException("User không tồn tại.");

            // 6. Tạo token mới
            var newTokenRaw = _tokenGenerator.GenerateRefreshToken();
            var newTokenHash = _tokenGenerator.HashToken(newTokenRaw);

            var newToken = RefreshTokensDomain.Create(userId: token.UserId,tokenHash: newTokenHash, deviceId: token.DeviceId);

            await _refreshTokenRepository.AddAsync(newToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken); // ← save để có Id

            // 7. Revoke token cũ
            token.ReplaceBy(newToken.Id);
            await _refreshTokenRepository.UpdateAsync(token);

            // 8. Update session → gắn token mới
            session.AssignToken(newToken.Id);
            await _sessionRepository.UpdateAsync(session);

            // 9. Save tất cả
            await _unitOfWork.SaveChangesAsync(cancellationToken);  

            // 10. Generate access token mới
            var newAccessToken = _jwtService.GenerateToken(user);

            return new RefreshTokenResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newTokenRaw
            };
        }
    }
}
