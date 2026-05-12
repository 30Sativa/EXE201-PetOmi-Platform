using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Feature.Auth.DTOs.Response;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.Extensions.Configuration;
namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailVerificationTokenRepository _emailVerificationRepository;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ITokenGenerator _tokenGenerator;

        public RegisterCommandHandler(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IUnitOfWork unitOfWork,
            IEmailVerificationTokenRepository emailVerificationRepository,
            IEmailService emailService,
            IConfiguration configuration, 
            ITokenGenerator tokenGenerator)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _unitOfWork = unitOfWork;
            _emailVerificationRepository = emailVerificationRepository;
            _emailService = emailService;
            _configuration = configuration;
            _tokenGenerator = tokenGenerator;
        }

        public async Task<RegisterResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            var email = new Email(request.Request.Email);

            // 1. Check email tồn tại
            var existingUser = await _userRepository.GetByNormalizedEmail(email.NormalizedValue);
            if (existingUser != null)
                throw new ConflictException("Email này đã được sử dụng.");

            // 2. Hash password
            var passwordHash = _passwordHasher.Hash(request.Request.Password);

            // 3. Tạo user
            var user = UserDomain.Create(email, new PasswordHash(passwordHash));
            await _userRepository.AddAsync(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 4. Tạo verification token


            var rawToken = _tokenGenerator.GenerateRefreshToken();

            var hashedToken = _tokenGenerator.HashToken(rawToken);

            var tokenDomain = EmailVerificationTokenDomain.Create(
                userId: user.Id,
                tokenHash: hashedToken
                );

            await _emailVerificationRepository.AddAsync(tokenDomain);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 5. Gửi email
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            var verificationLink = $"{frontendUrl}/verify-email?token={rawToken}";
            await _emailService.SendEmailVerificationAsync(user.Email.Value, verificationLink);

            return new RegisterResponse
            {
                UserId = user.Id,
                Email = user.Email.Value
            };
        }
    }

}