using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class UserDeviceMapper
    {
        public static UserDeviceDomain ToDomain(this UserDevice entity)
        {
            return UserDeviceDomain.Reconstitute(
                id: entity.DeviceId,
                userId: entity.UserId,
                deviceName: entity.DeviceName,
                deviceType: entity.DeviceType ?? string.Empty,
                deviceFingerprint: entity.DeviceFingerprint ?? string.Empty,
                deviceToken: entity.DeviceToken,
                userAgent: entity.UserAgent,
                isBlocked: entity.IsBlocked ,
                createdAt: entity.CreatedAt,
                lastLoginAt: entity.LastLoginAt
            );
        }
        public static UserDevice ToEntity(this UserDeviceDomain domain)
        {
            return new UserDevice
            {
                DeviceId = domain.Id,
                UserId = domain.UserId,
                DeviceName = domain.DeviceName,
                DeviceType = domain.DeviceType,
                DeviceFingerprint = domain.DeviceFingerprint,
                DeviceToken = domain.DeviceToken,
                UserAgent = domain.UserAgent,
                IsBlocked = domain.IsBlocked,
                CreatedAt = domain.CreatedAt,
                LastLoginAt = domain.LastLoginAt
            };
        }
    }
}
