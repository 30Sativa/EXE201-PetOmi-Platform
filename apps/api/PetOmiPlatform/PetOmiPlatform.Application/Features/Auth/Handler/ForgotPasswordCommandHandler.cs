using MediatR;
using Microsoft.Extensions.Configuration;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordResetTokenRepository _tokenRepository;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly string _frontendUrl;
        private readonly ITokenGenerator _tokenGenerator;

        public ForgotPasswordCommandHandler(
            IUserRepository userRepository,
            IPasswordResetTokenRepository tokenRepository,
            IEmailService emailService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration, 
            ITokenGenerator tokenGenerator)
        {
            _userRepository = userRepository;
            _tokenRepository = tokenRepository;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
            _frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:3000";
            _tokenGenerator = tokenGenerator;
        }

        public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
        {
            var user = await _userRepository.GetByEmailAsync(new Email(request.Request.Email));

            // Không throw nếu không tìm thấy — tránh email enumeration attack
            if (user == null) return;

            // Tạo reset token
            var rawToken = _tokenGenerator.GenerateRefreshToken();
            var hashToken  = _tokenGenerator.HashToken(rawToken);


            var tokenDomain = PasswordResetTokenDomain.Create(user.Id, hashToken);
            await _tokenRepository.AddAsync(tokenDomain);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var resetLink = $"{_frontendUrl}/reset-password?token={rawToken}";
            await _emailService.SendPasswordResetAsync(user.Email.Value, resetLink);
        }
    }
}
