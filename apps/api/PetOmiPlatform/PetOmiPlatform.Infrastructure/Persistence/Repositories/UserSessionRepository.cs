using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class UserSessionRepository : IUserSessionRepository
    {
        private readonly PetOmniDbContext _dbContext;

        public UserSessionRepository(PetOmniDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        public async Task AddAsync(UserSessionDomain session)
        {
            var entity = session.ToEntity();
            await _dbContext.UserSessions.AddAsync(entity);
        }

        public async Task<UserSessionDomain?> GetByIdAsync(Guid sessionId)
        {
            var entity = await _dbContext.UserSessions.FindAsync(sessionId);
            return entity?.ToDomain();
        }

        public async Task<List<UserSessionDomain>> GetByRefreshTokenIdAsync(Guid refreshTokenId)
        {
            var entities = await _dbContext.UserSessions.Where(s => s.RefreshTokenId == refreshTokenId).ToListAsync();

            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<UserSessionDomain?> GetByUserAndDeviceAsync(Guid userId, Guid? deviceId)
        {

            var entity = await _dbContext.UserSessions
                .FirstOrDefaultAsync(s =>
                s.UserId == userId &&
                s.DeviceId == deviceId &&
                s.IsActive);
            if (entity == null)
                return null;
            return entity.ToDomain();
        }

        public async Task UpdateAsync(UserSessionDomain session)
        {
            var entity = await _dbContext.UserSessions.FindAsync(session.Id);
            if (entity == null) return;

            entity.IsActive = session.IsActive;
            entity.RefreshTokenId = session.RefreshTokenId;
            entity.LogoutAt = session.LogoutAt;
            entity.LastActivityAt = session.LastActivityAt;

        }
    }
}
