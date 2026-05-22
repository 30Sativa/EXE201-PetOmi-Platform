using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPrescriptionRepository
    {
        Task AddAsync(PrescriptionDomain prescription);
        Task<PrescriptionDomain?> GetByIdAsync(Guid prescriptionId);
        Task<IEnumerable<PrescriptionDomain>> GetByExaminationIdAsync(Guid examinationId);
        Task UpdateAsync(PrescriptionDomain prescription);
        Task DeleteAsync(Guid prescriptionId);
    }
}
