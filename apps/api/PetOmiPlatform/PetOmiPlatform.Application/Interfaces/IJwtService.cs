using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface IJwtService
    {
        // Token thường dùng khi login - ActiveRole mặc định là "Owner"
        string GenerateToken(UserDomain user);
        // Token dùng khi user switch role hoặc clinic - ActiveRole và ActiveClinicId được cung cấp
        string GenerateTokenWithRole(UserDomain user, string activeRole, Guid? activeClinicId = null);

    }
}
