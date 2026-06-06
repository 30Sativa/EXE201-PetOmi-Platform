using Microsoft.Extensions.Configuration;
using PetOmiPlatform.Domain.Interfaces.Services;
using System.Security.Cryptography;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class ShareCodeHasher : IShareCodeHasher
    {
        private readonly byte[] _secretBytes;

        public ShareCodeHasher(IConfiguration configuration)
        {
            var secret = configuration["PetHealthShare:HashSecret"]
                ?? configuration["JwtSettings:Secret"]
                ?? configuration["Jwt:Secret"];

            if (string.IsNullOrWhiteSpace(secret))
                throw new InvalidOperationException("Missing share code hash secret.");

            _secretBytes = Encoding.UTF8.GetBytes(secret);
        }

        public string Hash(string code)
        {
            var normalizedCode = Normalize(code);
            using var hmac = new HMACSHA256(_secretBytes);
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(normalizedCode));
            return Convert.ToBase64String(hashBytes);
        }

        public bool Verify(string code, string hash)
        {
            var expectedHash = Hash(code);
            var expectedBytes = Encoding.UTF8.GetBytes(expectedHash);
            var actualBytes = Encoding.UTF8.GetBytes(hash);

            return expectedBytes.Length == actualBytes.Length
                && CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
        }

        private static string Normalize(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                throw new ArgumentException("Share code is required.", nameof(code));

            return code.Trim().ToUpperInvariant();
        }
    }
}
