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
    public class UserDeviceRepository : IUserDeviceRepository
    {
        private readonly PetOmniDbContext _context;

        public UserDeviceRepository(PetOmniDbContext context)
            => _context = context;

        public async Task<UserDeviceDomain?> GetByFingerprintAsync(Guid userId, string fingerprint)
        {
            var entity = await _context.UserDevices
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId &&
                    d.DeviceFingerprint == fingerprint);

            return entity?.ToDomain();
        }

        public async Task<UserDeviceDomain?> GetByIdAsync(Guid deviceId)
        {
            var entity = await _context.UserDevices.FindAsync(deviceId);
            return entity?.ToDomain();
        }

        public async Task<List<UserDeviceDomain>> GetByUserIdAsync(Guid userId)
        {
            var entities = await _context.UserDevices
                .Where(d => d.UserId == userId)
                .ToListAsync();

            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task AddAsync(UserDeviceDomain device)
        {
            var entity = device.ToEntity();
            await _context.UserDevices.AddAsync(entity);
        }

        public async Task UpdateAsync(UserDeviceDomain device)
        {
            var entity = await _context.UserDevices.FindAsync(device.Id);
            if (entity == null) return;

            entity.DeviceName = device.DeviceName;
            entity.DeviceType = device.DeviceType;
            entity.DeviceToken = device.DeviceToken;
            entity.UserAgent = device.UserAgent;
            entity.IsBlocked = device.IsBlocked;
            entity.LastLoginAt = device.LastLoginAt;
            entity.UpdatedAt = DateTime.UtcNow;
            // DeviceFingerprint không update — định danh device
        }
    }
}
