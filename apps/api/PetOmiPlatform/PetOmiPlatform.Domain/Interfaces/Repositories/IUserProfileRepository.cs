using PetOmiPlatform.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IUserProfileRepository
    {
        Task<UserProfileDomain?> GetByUserIdAsync(Guid userId);
        Task AddAsync(UserProfileDomain profile);
        Task UpdateAsync(UserProfileDomain profile);
    }
}
