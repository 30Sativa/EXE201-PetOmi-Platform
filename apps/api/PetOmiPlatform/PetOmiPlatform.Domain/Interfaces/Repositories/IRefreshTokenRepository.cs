using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IRefreshTokenRepository
    {
        Task AddAsync(RefreshTokensDomain refreshToken);
        Task<RefreshTokensDomain> GetByTokenHashAsync(string tokenHash);

        //Dùng cho logout, revoke token, check reuse attack
        Task<List<RefreshTokensDomain>> GetActiveTokensByUserIdAsync(Guid userId);
        Task<RefreshTokensDomain> GetActiveTokenBySessionIdAsync(Guid sessionId);
        Task UpdateAsync(RefreshTokensDomain refreshToken);

        Task<RefreshTokensDomain> GetByIdAsync(Guid id);
    }
}
