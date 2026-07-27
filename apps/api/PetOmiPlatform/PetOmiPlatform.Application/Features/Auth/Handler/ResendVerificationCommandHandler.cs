using MediatR;
using Microsoft.Extensions.Configuration;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Features.Auth.Services;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.ValueObjects;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class ResendVerificationCommandHandler : IRequestHandler<ResendVerificationCommand>
    {
        private const int ResendCooldownSeconds = 60;

        private readonly IUserRepository _userRepository;
        private readonly IEmailVerificationTokenRepository _emailVerificationRepository;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        private readonly ITokenGenerator _tokenGenerator;

        public ResendVerificationCommandHandler(
            IUserRepository userRepository,
            IEmailVerificationTokenRepository emailVerificationRepository,
            IEmailService emailService,
            IUnitOfWork unitOfWork,
            IConfiguration configuration,
            ITokenGenerator tokenGenerator)
        {
            _userRepository = userRepository;
            _emailVerificationRepository = emailVerificationRepository;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _tokenGenerator = tokenGenerator;
        }

        public async Task Handle(ResendVerificationCommand request, CancellationToken cancellationToken)
        {
            var user = await _userRepository.GetByEmailAsync(new Email(request.Request.Email));

            // Always return success to avoid exposing whether an email is registered or verified.
            if (user == null || user.EmailVerified)
            {
                return;
            }

            var latestToken = await _emailVerificationRepository.GetLatestByUserIdAsync(user.Id);
            if (latestToken != null && latestToken.CreatedAt > DateTime.UtcNow.AddSeconds(-ResendCooldownSeconds))
            {
                return;
            }

            // A resend supersedes every previously issued unused link, including an expired one.
            if (latestToken != null)
            {
                latestToken.Invalidate();
                await _emailVerificationRepository.UpdateAsync(latestToken);
            }

            var rawToken = _tokenGenerator.GenerateRefreshToken();
            var tokenDomain = EmailVerificationTokenDomain.Create(
                userId: user.Id,
                tokenHash: _tokenGenerator.HashToken(rawToken));

            await _emailVerificationRepository.AddAsync(tokenDomain);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var verificationLink = AuthRedirectUrlBuilder.Build(
                request.Client,
                _configuration["FrontendUrl"],
                _configuration["MobileDeepLink"],
                $"verify-email?token={Uri.EscapeDataString(rawToken)}");

            await _emailService.SendEmailVerificationAsync(user.Email.Value, verificationLink);
        }
    }
}
