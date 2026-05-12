using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPasswordResetTokenRepository
    {
        Task AddAsync(PasswordResetTokenDomain token);
        Task<PasswordResetTokenDomain?> GetByTokenAsync(string token);
        Task UpdateAsync(PasswordResetTokenDomain token);
    }
}
