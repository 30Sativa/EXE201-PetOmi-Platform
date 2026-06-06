using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class AuditLogRepository : IAuditLogRepository
    {
        private readonly PetOmniDbContext _context;

        public AuditLogRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(AuditLogDomain auditLog)
        {
            var entity = auditLog.ToEntity();
            await _context.AuditLogs.AddAsync(entity);
        }

        public async Task<(List<AuditLogDomain> Items, int TotalCount)> GetPagedAsync(
            string? category,
            string? action,
            Guid? userId,
            DateTime? fromDate,
            DateTime? toDate,
            int page,
            int pageSize)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(a => a.Category == category);

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(a => a.Action == action);

            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            if (fromDate.HasValue)
                query = query.Where(a => a.CreatedAt >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(a => a.CreatedAt <= toDate.Value);

            var total = await query.CountAsync();

            var entities = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(a => a.User)
                .ToListAsync();

            var domains = entities.Select(e => AuditLogDomain.Reconstitute(
                e.AuditLogId,
                e.Action,
                e.Category,
                e.EntityType,
                e.EntityId,
                e.Ipaddress,
                e.UserAgent,
                e.Severity,
                e.CreatedAt,
                e.User?.Email,
                e.UserId
            )).ToList();

            return (domains, total);
        }
    }
}
