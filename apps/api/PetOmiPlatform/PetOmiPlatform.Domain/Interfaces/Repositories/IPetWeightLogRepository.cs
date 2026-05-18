using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPetWeightLogRepository
    {
        Task<PetWeightLogDomain?> GetByIdAsync(Guid weightLogId);
        Task<List<PetWeightLogDomain>> GetByPetIdAsync(Guid petId);
        Task AddAsync(PetWeightLogDomain weightLog);
        Task UpdateAsync(PetWeightLogDomain weightLog);
        Task DeleteAsync(Guid weightLogId);
    }
}
