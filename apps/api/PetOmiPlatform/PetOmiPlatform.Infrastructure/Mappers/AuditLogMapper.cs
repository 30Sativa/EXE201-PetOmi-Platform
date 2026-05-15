using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class AuditLogMapper
    {
        public static AuditLog ToEntity(this AuditLogDomain domain)
        {
            return new AuditLog
            {
                AuditLogId = domain.Id,
                UserId = domain.UserId,
                Action = domain.Action,
                Category = domain.Category,
                EntityType = domain.EntityType,
                EntityId = domain.EntityId,
                Ipaddress = domain.IpAddress,
                UserAgent = domain.UserAgent,
                Severity = domain.Severity,
                CreatedAt = domain.CreatedAt
            };
        }
    }
}
