using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IUserDeviceRepository
    {
        Task<UserDeviceDomain?> GetByFingerprintAsync(Guid userId, string fingerprint);
        Task<UserDeviceDomain?> GetByIdAsync(Guid deviceId);
        Task<List<UserDeviceDomain>> GetByUserIdAsync(Guid userId);
        Task AddAsync(UserDeviceDomain device);
        Task UpdateAsync(UserDeviceDomain device);
    }
}
