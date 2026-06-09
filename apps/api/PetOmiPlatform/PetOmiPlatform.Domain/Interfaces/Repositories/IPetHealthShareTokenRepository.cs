using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPetHealthShareTokenRepository
    {
        Task<PetHealthShareTokenDomain?> GetByIdAsync(Guid shareTokenId);
        Task<PetHealthShareTokenDomain?> GetByDisplayCodeAsync(string displayCode);
        Task<PetHealthShareTokenDomain?> GetLatestByDisplayCodeAsync(string displayCode);
        Task<PetHealthShareTokenDomain?> GetByTokenHashAsync(string tokenHash);
        Task<List<PetHealthShareTokenDomain>> GetByPetIdAsync(Guid petId);
        Task<bool> DisplayCodeExistsAsync(string displayCode);
        Task AddAsync(PetHealthShareTokenDomain token);
        Task UpdateAsync(PetHealthShareTokenDomain token);
    }
}
