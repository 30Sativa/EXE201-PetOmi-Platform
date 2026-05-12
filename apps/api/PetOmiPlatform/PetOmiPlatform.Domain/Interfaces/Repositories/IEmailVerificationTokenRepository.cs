using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IEmailVerificationTokenRepository
    {
        Task AddAsync(EmailVerificationTokenDomain token);
        Task<EmailVerificationTokenDomain?> GetByTokenAsync(string token);
        Task<EmailVerificationTokenDomain?> GetLatestByUserIdAsync(Guid userId);
        Task UpdateAsync(EmailVerificationTokenDomain token);
    }
}
