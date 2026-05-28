using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IAuditLogRepository
    {
        Task AddAsync(AuditLogDomain auditLog);
        Task<(List<AuditLogDomain> Items, int TotalCount)> GetPagedAsync(
            string? category,
            string? action,
            Guid? userId,
            DateTime? fromDate,
            DateTime? toDate,
            int page,
            int pageSize);
    }
}
