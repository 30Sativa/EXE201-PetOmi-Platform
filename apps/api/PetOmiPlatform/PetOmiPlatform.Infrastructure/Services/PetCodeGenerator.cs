using PetOmiPlatform.Domain.Interfaces.Services;
using System.Security.Cryptography;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class PetCodeGenerator : IPetCodeGenerator
    {
        private const string Alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

        public string GeneratePublicPetCode()
        {
            return $"PO-{NextSegment()}-{NextSegment()}";
        }

        public string GenerateHealthShareCode()
        {
            return $"HLT-{NextSegment()}-{NextSegment()}";
        }

        private static string NextSegment()
        {
            return new string(Enumerable.Range(0, 3)
                .Select(_ => Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)])
                .ToArray());
        }
    }
}
