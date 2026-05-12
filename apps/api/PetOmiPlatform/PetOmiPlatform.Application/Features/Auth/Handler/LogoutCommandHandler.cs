using MediatR;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class LogoutCommandHandler : IRequestHandler<LogoutCommand>
    {
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUserSessionRepository _sessionRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenGenerator _tokenGenerator;

        public LogoutCommandHandler(
            IRefreshTokenRepository refreshTokenRepository,
            IUserSessionRepository sessionRepository,
            IUnitOfWork unitOfWork,
            ITokenGenerator tokenGenerator)
        {
            _refreshTokenRepository = refreshTokenRepository;
            _sessionRepository = sessionRepository;
            _unitOfWork = unitOfWork;
            _tokenGenerator = tokenGenerator;
        }

        public async Task Handle(LogoutCommand request, CancellationToken cancellationToken)
        {
            // 1. Hash token → find
            var tokenHash = _tokenGenerator.HashToken(request.Request.RefreshToken);
            var token = await _refreshTokenRepository.GetByTokenHashAsync(tokenHash);

            // Token không tồn tại hoặc đã revoked → coi như đã logout
            if (token == null || token.IsRevoked)
                return;

            // 2. Revoke token
            token.Revoke();
            await _refreshTokenRepository.UpdateAsync(token);

            // 3. Revoke session liên quan
            var sessions = await _sessionRepository.GetByRefreshTokenIdAsync(token.Id);
            foreach (var session in sessions)
            {
                session.Revoke();
                await _sessionRepository.UpdateAsync(session);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
