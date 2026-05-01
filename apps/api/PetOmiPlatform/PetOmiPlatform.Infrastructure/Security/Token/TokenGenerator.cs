using PetOmiPlatform.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Security.Token
{
    public class TokenGenerator : ITokenGenerator
    {
        public string GenerateRefreshToken()
        {
            var randomBytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(randomBytes);
        }

        public string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
