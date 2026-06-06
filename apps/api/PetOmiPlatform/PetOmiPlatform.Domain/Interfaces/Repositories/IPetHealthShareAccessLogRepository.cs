using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPetHealthShareAccessLogRepository
    {
        Task AddAsync(PetHealthShareAccessLogDomain accessLog);
        Task<List<PetHealthShareAccessLogDomain>> GetByPetIdAsync(Guid petId, int limit);
        Task<List<PetHealthShareAccessLogDomain>> GetByShareTokenIdAsync(Guid shareTokenId, int limit);
    }
}
