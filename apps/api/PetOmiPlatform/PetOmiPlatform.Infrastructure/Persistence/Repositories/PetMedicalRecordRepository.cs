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
    public class PetMedicalRecordRepository : IPetMedicalRecordRepository
    {
        private readonly PetOmniDbContext _context;

        public PetMedicalRecordRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<PetMedicalRecordDomain?> GetByIdAsync(Guid medicalRecordId)
        {
            var entity = await _context.PetMedicalRecords
                .FirstOrDefaultAsync(m => m.MedicalRecordId == medicalRecordId && m.IsActive);
            return entity?.ToDomain();
        }

        public async Task<List<PetMedicalRecordDomain>> GetByPetIdAsync(Guid petId)
        {
            var entities = await _context.PetMedicalRecords
                .Where(m => m.PetId == petId && m.IsActive)
                .OrderByDescending(m => m.RecordDate)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<List<PetMedicalRecordDomain>> GetByPetIdAndTypeAsync(Guid petId, string recordType)
        {
            var entities = await _context.PetMedicalRecords
                .Where(m => m.PetId == petId && m.RecordType == recordType && m.IsActive)
                .OrderByDescending(m => m.RecordDate)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task AddAsync(PetMedicalRecordDomain medicalRecord)
        {
            await _context.PetMedicalRecords.AddAsync(medicalRecord.ToEntity());
        }

        public async Task UpdateAsync(PetMedicalRecordDomain medicalRecord)
        {
            var entity = await _context.PetMedicalRecords.FindAsync(medicalRecord.Id);
            if (entity == null) return;

            entity.RecordType = medicalRecord.RecordType;
            entity.Title = medicalRecord.Title;
            entity.Description = medicalRecord.Description;
            entity.RecordDate = medicalRecord.RecordDate;
            entity.VetName = medicalRecord.VetName;
            entity.ClinicName = medicalRecord.ClinicName;
            entity.MedicationName = medicalRecord.MedicationName;
            entity.Dosage = medicalRecord.Dosage;
            entity.StartDate = medicalRecord.StartDate;
            entity.EndDate = medicalRecord.EndDate;
            entity.AttachmentUrl = medicalRecord.AttachmentUrl;
            entity.UpdatedAt = medicalRecord.UpdatedAt;
            entity.DeletedAt = medicalRecord.DeletedAt;
            entity.IsActive = medicalRecord.IsActive;
        }

        public async Task DeleteAsync(Guid medicalRecordId)
        {
            var entity = await _context.PetMedicalRecords.FindAsync(medicalRecordId);
            if (entity != null)
            {
                entity.IsActive = false;
                entity.DeletedAt = DateTime.UtcNow;
            }
        }
    }
}
