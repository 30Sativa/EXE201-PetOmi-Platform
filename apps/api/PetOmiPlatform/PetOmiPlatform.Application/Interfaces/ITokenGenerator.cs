using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface ITokenGenerator
    {
        string GenerateRefreshToken();
        string HashToken(string token);
    }
}
