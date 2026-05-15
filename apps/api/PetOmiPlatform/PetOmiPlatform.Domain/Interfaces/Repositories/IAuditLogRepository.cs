using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IAuditLogRepository
    {
        Task AddAsync(AuditLogDomain auditLog);
    }
}
