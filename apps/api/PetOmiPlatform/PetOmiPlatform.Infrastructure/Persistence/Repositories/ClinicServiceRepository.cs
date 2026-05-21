using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class ClinicServiceRepository : IClinicServiceRepository
    {
        private readonly PetOmniDbContext _context;

        public ClinicServiceRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ClinicServiceDomain service)
        {
            await _context.ClinicServices.AddAsync(service.ToEntity());
        }

        public async Task<ClinicServiceDomain?> GetByIdAsync(Guid serviceId)
        {
            var entity = await _context.ClinicServices.FindAsync(serviceId);
            return entity?.ToDomain();
        }

        public async Task<IEnumerable<ClinicServiceDomain>> GetByClinicIdAsync(Guid clinicId, bool activeOnly = true)
        {
            var query = _context.ClinicServices
                .Where(s => s.ClinicId == clinicId);

            if (activeOnly)
                query = query.Where(s => s.IsActive);

            return await query
                .OrderBy(s => s.ServiceName)
                .Select(s => s.ToDomain())
                .ToListAsync();
        }

        public async Task UpdateAsync(ClinicServiceDomain service)
        {
            var entity = await _context.ClinicServices.FindAsync(service.Id);
            if (entity == null) return;

            var updated = service.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
