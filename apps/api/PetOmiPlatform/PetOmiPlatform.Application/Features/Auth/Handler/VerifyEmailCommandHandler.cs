using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand>
    {
        private readonly IEmailVerificationTokenRepository _tokenRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenGenerator _tokenGenerator;

        public VerifyEmailCommandHandler(
            IEmailVerificationTokenRepository tokenRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            ITokenGenerator tokenGenerator)
        {
            _tokenRepository = tokenRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _tokenGenerator = tokenGenerator;
        }

        public async Task Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
        {
            // 1. hash token → find

            var hashToken = _tokenGenerator.HashToken(request.Token);
            var token = await _tokenRepository.GetByTokenAsync(hashToken)
                ?? throw new NotFoundException("Token không hợp lệ.");

            // 2. Validate
            token.EnsureValid();

            // 3. Find user
            var user = await _userRepository.GetByIdAsync(token.UserId)
                ?? throw new NotFoundException("User không tồn tại.");

            // 4. Verify email
            user.VerifyEmail();
            token.MarkAsUsed();

            await _userRepository.UpdateAsync(user);
            await _tokenRepository.UpdateAsync(token);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
