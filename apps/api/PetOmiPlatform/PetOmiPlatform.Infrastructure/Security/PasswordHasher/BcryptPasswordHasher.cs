using Org.BouncyCastle.Crypto.Generators;
using BCrypt.Net;
using System;
using System.Collections.Generic;
using System.Text;
using PetOmiPlatform.Domain.Interfaces.Services;

namespace PetOmiPlatform.Infrastructure.Security.PasswordHasher
{
    public class BcryptPasswordHasher : IPasswordHasher
    {
        public string Hash(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);

        }

        public bool Verify(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }
    }
}
