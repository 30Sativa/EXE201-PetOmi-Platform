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

        public LoginCommandHandler(
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            IJwtService jwtService,
            ITokenGenerator tokenGenerator)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _jwtService = jwtService;
            _tokenGenerator = tokenGenerator;
        }
        public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            //1. find user
            var user = await _userRepository.GetByEmailAsync(new Email(request.Request.Email));

            if (user == null)
            {
                throw new NotFoundException("User không tồn tại");
            }

            // 2. Validate login (DOMAIN xử lý)
            user.ValidateLogin(request.Request.Password, _passwordHasher);

            // 3. Generate Access Token
            var accessToken = _jwtService.GenerateToken(user);

            // 4. Generate Refresh Token (raw)
            var refreshTokenRaw = _tokenGenerator.GenerateRefreshToken();

            // 5. Hash refresh token
            var refreshTokenHash = _tokenGenerator.HashToken(refreshTokenRaw);

            // 6. Create refresh token domain
            var refreshToken = RefreshTokensDomain.Create(user.Id, refreshTokenHash);

            // 7. Save DB
            await _refreshTokenRepository.AddAsync(refreshToken);

            // nếu bạn muốn update last login thì domain đã làm rồi
            _userRepository.UpdateAsync(user);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 8. Return response
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
