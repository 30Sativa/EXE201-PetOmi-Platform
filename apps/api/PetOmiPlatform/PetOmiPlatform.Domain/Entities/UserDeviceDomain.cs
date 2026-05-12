using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Entities
{
    public class UserDeviceDomain : BaseEntity
    {
        public Guid UserId { get; private set; }
        public string DeviceName { get; private set; } = string.Empty;
        public string DeviceType { get; private set; } = string.Empty;
        public string DeviceFingerprint { get; private set; } = string.Empty;
        public string? DeviceToken { get; private set; }
        public string? UserAgent { get; private set; }
        public bool IsBlocked { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? LastLoginAt { get; private set; }

        private UserDeviceDomain() { }

        public static UserDeviceDomain Create(
            Guid userId,
            string deviceName,
            string deviceType,
            string deviceFingerprint,
            string? userAgent)
        {
            return new UserDeviceDomain
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DeviceName = deviceName,
                DeviceType = deviceType,
                DeviceFingerprint = deviceFingerprint,
                UserAgent = userAgent,
                IsBlocked = false,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };
        }

        public static UserDeviceDomain Reconstitute(
            Guid id,
            Guid userId,
            string deviceName,
            string deviceType,
            string deviceFingerprint,
            string? deviceToken,
            string? userAgent,
            bool isBlocked,
            DateTime createdAt,
            DateTime? lastLoginAt)
        {
            return new UserDeviceDomain
            {
                Id = id,
                UserId = userId,
                DeviceName = deviceName,
                DeviceType = deviceType,
                DeviceFingerprint = deviceFingerprint,
                DeviceToken = deviceToken,
                UserAgent = userAgent,
                IsBlocked = isBlocked,
                CreatedAt = createdAt,
                LastLoginAt = lastLoginAt
            };
        }

        public void EnsureNotBlocked()
        {
            if (IsBlocked)
                throw new DomainException("Thiết bị đã bị chặn.");
        }

        public void UpdateLastLogin(string? userAgent)
        {
            LastLoginAt = DateTime.UtcNow;
            UserAgent = userAgent;
        }

        public void Block()
        {
            IsBlocked = true;
        }

        public void Unblock()
        {
            IsBlocked = false;
        }
    }
}
