using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Common.Settings;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Security.Jwt
{
    public class JwtService : IJwtService
    {
        private readonly JwtSettings _settings;

        public JwtService(IOptions<JwtSettings> settings)
            => _settings = settings.Value;
        public string GenerateToken(UserDomain user)
        {
            var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email.Value),
           // new Claim(ClaimTypes.Role, user.Role.ToString()), // để sau này thêm sau 
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // ← unique token id
        };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _settings.Issuer,
                audience: _settings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
