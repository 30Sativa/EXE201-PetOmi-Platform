using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
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
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Application.Feature.Auth.DTOs.Response;
using PetOmiPlatform.Application.Features.Auth.Services;
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
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IReferralRepository _referralRepository;
        private readonly IPromotionSettingsService _promotionSettings;
        public RegisterCommandHandler(
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IUnitOfWork unitOfWork,
            IEmailVerificationTokenRepository emailVerificationRepository,
            IEmailService emailService,
            IConfiguration configuration,
            ITokenGenerator tokenGenerator,
            IUserRoleRepository userRoleRepository,
            IReferralRepository referralRepository,
            IPromotionSettingsService promotionSettings)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _unitOfWork = unitOfWork;
            _emailVerificationRepository = emailVerificationRepository;
            _emailService = emailService;
            _configuration = configuration;
            _tokenGenerator = tokenGenerator;
            _userRoleRepository = userRoleRepository;
            _referralRepository = referralRepository;
            _promotionSettings = promotionSettings;
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

            // 4. Gán role mặc định cho user
            await _userRoleRepository.AddAsync(user.Id, RoleConstants.OwnerId);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 4b. Xử lý mã giới thiệu (tùy chọn). Lỗi ở đây KHÔNG làm hỏng việc đăng ký.
            await TryApplyReferralAsync(request.Request.ReferralCode, user.Id, cancellationToken);

            var rawToken = _tokenGenerator.GenerateRefreshToken();

            var hashedToken = _tokenGenerator.HashToken(rawToken);

            var tokenDomain = EmailVerificationTokenDomain.Create(
                userId: user.Id,
                tokenHash: hashedToken
                );

            await _emailVerificationRepository.AddAsync(tokenDomain);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 5. Gửi email
            var verificationLink = AuthRedirectUrlBuilder.Build(
                request.Client,
                _configuration["FrontendUrl"],
                _configuration["MobileDeepLink"],
                $"verify-email?token={Uri.EscapeDataString(rawToken)}");
            await _emailService.SendEmailVerificationAsync(user.Email.Value, verificationLink);

            return new RegisterResponse
            {
                UserId = user.Id,
                Email = user.Email.Value
            };
        }

        /// <summary>
        /// Nếu người mới nhập mã giới thiệu hợp lệ: cộng quota (BonusMessages) cho người giới thiệu.
        /// Ràng buộc: tính năng đang bật, mã tồn tại, không tự giới thiệu, người mới chưa từng được tính.
        /// </summary>
        private async Task TryApplyReferralAsync(string? referralCode, Guid newUserId, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(referralCode))
                return;

            try
            {
                var promo = await _promotionSettings.GetAsync(ct);
                if (!promo.ReferralEnabled || promo.ReferralBonusMessages <= 0)
                    return;

                var referrerUserId = await _referralRepository.GetUserIdByReferralCodeAsync(referralCode);
                if (referrerUserId == null || referrerUserId.Value == newUserId)
                    return;

                // Chống trùng: 1 người mới chỉ được tính 1 lần.
                if (await _referralRepository.HasRedemptionForNewUserAsync(newUserId))
                    return;

                await _referralRepository.AddRedemptionAsync(
                    referrerUserId.Value, newUserId, referralCode, promo.ReferralBonusMessages);
                await _unitOfWork.SaveChangesAsync(ct);
            }
            catch
            {
                // Không chặn đăng ký nếu xử lý referral lỗi.
            }
        }
    }

}
