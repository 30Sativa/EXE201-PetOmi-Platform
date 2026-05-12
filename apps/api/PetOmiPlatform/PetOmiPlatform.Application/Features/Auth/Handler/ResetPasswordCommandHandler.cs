using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
    {
        private readonly IPasswordResetTokenRepository _tokenRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenGenerator _tokenGenerator;
        public ResetPasswordCommandHandler(
            IPasswordResetTokenRepository tokenRepository,
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IUnitOfWork unitOfWork,
            ITokenGenerator tokenGenerator)
        {
            _tokenRepository = tokenRepository;
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _unitOfWork = unitOfWork;
            _tokenGenerator = tokenGenerator;
        }

        public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
        {
            // 1. hash token → find

            var hashToken = _tokenGenerator.HashToken(request.Request.Token);
            var token = await _tokenRepository.GetByTokenAsync(hashToken)
                ?? throw new NotFoundException("Token không hợp lệ.");

            // 2. Validate
            token.EnsureValid();

            // 3. Find user
            var user = await _userRepository.GetByIdAsync(token.UserId)
                ?? throw new NotFoundException("User không tồn tại.");

            // 4. Hash password mới
            var newHash = _passwordHasher.Hash(request.Request.NewPassword);
            user.ChangePassword(new PasswordHash(newHash));
            token.MarkAsUsed();

            await _userRepository.UpdateAsync(user);
            await _tokenRepository.UpdateAsync(token);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
