using PetOmiPlatform.Domain.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Entities
{
    public class AuditLogDomain : BaseEntity
    {
        public Guid? UserId { get; private set; }
        public string Action { get; private set; }
        public string Category { get; private set; }
        public string? EntityType { get; private set; }
        public Guid? EntityId { get; private set; }
        public string? IpAddress { get; private set; }
        public string? UserAgent { get; private set; }
        public string Severity { get; private set; }
        public DateTime CreatedAt { get; private set; }

        private AuditLogDomain() { }

        public static AuditLogDomain Create(
            Guid? userId,
            string action,
            string category,
            string? entityType = null,
            Guid? entityId = null,
            string? ipAddress = null,
            string? userAgent = null,
            string severity = "Info")
        {
            return new AuditLogDomain
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                Category = category,
                EntityType = entityType,
                EntityId = entityId,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Severity = severity,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}
