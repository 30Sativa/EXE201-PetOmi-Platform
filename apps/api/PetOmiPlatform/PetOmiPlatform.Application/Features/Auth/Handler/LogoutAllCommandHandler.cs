using MediatR;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class LogoutAllCommandHandler : IRequestHandler<LogoutAllCommand>
    {
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IUserSessionRepository _sessionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public LogoutAllCommandHandler(
            IRefreshTokenRepository refreshTokenRepository,
            IUserSessionRepository sessionRepository,
            IUnitOfWork unitOfWork)
        {
            _refreshTokenRepository = refreshTokenRepository;
            _sessionRepository = sessionRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task Handle(LogoutAllCommand request, CancellationToken cancellationToken)
        {
            // 1. Revoke tất cả token active của user
            var tokens = await _refreshTokenRepository.GetActiveTokensByUserIdAsync(request.UserId);
            foreach (var token in tokens)
            {
                token.Revoke();
                await _refreshTokenRepository.UpdateAsync(token);
            }

            // 2. Revoke tất cả session active của user
            var sessions = await _sessionRepository.GetActiveSessionsByUserIdAsync(request.UserId);
            foreach (var session in sessions)
            {
                session.Revoke();
                await _sessionRepository.UpdateAsync(session);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
