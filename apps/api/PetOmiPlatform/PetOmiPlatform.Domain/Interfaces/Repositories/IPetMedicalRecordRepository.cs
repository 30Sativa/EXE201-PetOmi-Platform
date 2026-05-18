using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPetMedicalRecordRepository
    {
        Task<PetMedicalRecordDomain?> GetByIdAsync(Guid medicalRecordId);
        Task<List<PetMedicalRecordDomain>> GetByPetIdAsync(Guid petId);
        Task<List<PetMedicalRecordDomain>> GetByPetIdAndTypeAsync(Guid petId, string recordType);
        Task AddAsync(PetMedicalRecordDomain medicalRecord);
        Task UpdateAsync(PetMedicalRecordDomain medicalRecord);
        Task DeleteAsync(Guid medicalRecordId);
    }
}
