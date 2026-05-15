using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Text;

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
    }
}
