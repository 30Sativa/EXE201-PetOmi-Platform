using PetOmiPlatform.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPetHealthProfileRepository
    {
        Task<PetHealthProfileDomain?> GetByPetIdAsync(Guid petId);
        Task AddAsync(PetHealthProfileDomain profile);
        Task UpdateAsync(PetHealthProfileDomain profile);
    }
}
