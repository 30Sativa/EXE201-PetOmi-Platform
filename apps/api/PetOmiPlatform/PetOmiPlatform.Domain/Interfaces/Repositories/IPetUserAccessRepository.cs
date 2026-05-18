using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPetUserAccessRepository
    {
        Task<PetUserAccessDomain?> GetByIdAsync(Guid petUserAccessId);
        Task<PetUserAccessDomain?> GetByPetAndUserAsync(Guid petId, Guid userId);
        Task<List<PetUserAccessDomain>> GetByPetIdAsync(Guid petId);
        Task<List<PetUserAccessDomain>> GetByUserIdAsync(Guid userId);
        Task AddAsync(PetUserAccessDomain access);
        Task UpdateAsync(PetUserAccessDomain access);
        Task RevokeAsync(Guid petUserAccessId);
    }
}
