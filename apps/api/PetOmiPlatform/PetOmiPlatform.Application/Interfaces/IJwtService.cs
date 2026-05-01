using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(UserDomain user);
    }
}
