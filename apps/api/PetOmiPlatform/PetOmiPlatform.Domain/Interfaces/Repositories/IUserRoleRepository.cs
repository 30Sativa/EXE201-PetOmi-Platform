using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IUserRoleRepository
    {
        Task AddAsync(Guid userId, Guid roleId);
    }
}
