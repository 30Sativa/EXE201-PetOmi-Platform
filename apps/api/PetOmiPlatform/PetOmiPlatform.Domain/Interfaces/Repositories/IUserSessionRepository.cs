using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IUserSessionRepository
    {
        Task<UserSessionDomain?> GetByUserAndDeviceAsync(Guid userId, Guid? deviceId);
        Task<UserSessionDomain?> GetByIdAsync(Guid sessionId);
        Task AddAsync(UserSessionDomain session);
        Task UpdateAsync(UserSessionDomain session);
        Task<List<UserSessionDomain>> GetByRefreshTokenIdAsync(Guid refreshTokenId);
        Task<List<UserSessionDomain>> GetActiveSessionsByUserIdAsync(Guid userId);
    }
}
