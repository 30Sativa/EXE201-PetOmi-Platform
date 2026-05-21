using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IClinicServiceRepository
    {
        Task AddAsync(ClinicServiceDomain service);
        Task<ClinicServiceDomain?> GetByIdAsync(Guid serviceId);
        Task<IEnumerable<ClinicServiceDomain>> GetByClinicIdAsync(Guid clinicId, bool activeOnly = true);
        Task UpdateAsync(ClinicServiceDomain service);
    }
}
