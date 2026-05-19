using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IUserRoleRepository
    {
        Task AddAsync(Guid userId, Guid roleId);
        Task<List<string>> GetRolesByUserIdAsync(Guid userId);
    }
}
