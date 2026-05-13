using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IVetProfileRepository
    {
        Task AddAsync(VetProfileDomain vetProfile);
        Task<VetProfileDomain?> GetByUserIdAsync(Guid userId);
        Task<VetProfileDomain?> GetByIdAsync(Guid vetProfileId);
    }
}
