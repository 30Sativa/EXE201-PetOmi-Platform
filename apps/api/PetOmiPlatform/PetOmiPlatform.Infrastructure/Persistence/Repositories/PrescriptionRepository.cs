using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class PrescriptionRepository : IPrescriptionRepository
    {
        private readonly PetOmniDbContext _context;

        public PrescriptionRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(PrescriptionDomain prescription)
        {
            await _context.Prescriptions.AddAsync(prescription.ToEntity());
        }

        public async Task<PrescriptionDomain?> GetByIdAsync(Guid prescriptionId)
        {
            var entity = await _context.Prescriptions.FindAsync(prescriptionId);
            return entity?.ToDomain();
        }

        public async Task<IEnumerable<PrescriptionDomain>> GetByExaminationIdAsync(Guid examinationId)
        {
            return await _context.Prescriptions
                .Where(p => p.ExaminationId == examinationId)
                .OrderBy(p => p.CreatedAt)
                .Select(p => p.ToDomain())
                .ToListAsync();
        }

        public async Task UpdateAsync(PrescriptionDomain prescription)
        {
            var entity = await _context.Prescriptions.FindAsync(prescription.Id);
            if (entity == null) return;

            var updated = prescription.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }

        public async Task DeleteAsync(Guid prescriptionId)
        {
            var entity = await _context.Prescriptions.FindAsync(prescriptionId);
            if (entity != null)
            {
                _context.Prescriptions.Remove(entity);
            }
        }
    }
}
