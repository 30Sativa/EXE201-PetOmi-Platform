using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class MedicalExaminationRepository : IMedicalExaminationRepository
    {
        private readonly PetOmniDbContext _context;

        public MedicalExaminationRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(MedicalExaminationDomain examination)
        {
            await _context.MedicalExaminations.AddAsync(examination.ToEntity());
        }

        public async Task<MedicalExaminationDomain?> GetByIdAsync(Guid examinationId)
        {
            var entity = await _context.MedicalExaminations.FindAsync(examinationId);
            return entity?.ToDomain();
        }

        public async Task<MedicalExaminationDomain?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            var entity = await _context.MedicalExaminations
                .FirstOrDefaultAsync(e => e.AppointmentId == appointmentId);
            return entity?.ToDomain();
        }

        public async Task<IEnumerable<MedicalExaminationDomain>> GetByPetIdAsync(Guid petId, int page, int pageSize)
        {
            return await _context.MedicalExaminations
                .Where(e => e.PetId == petId)
                .OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => e.ToDomain())
                .ToListAsync();
        }

        public async Task UpdateAsync(MedicalExaminationDomain examination)
        {
            var entity = await _context.MedicalExaminations.FindAsync(examination.Id);
            if (entity == null) return;

            var updated = examination.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
