using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IUserRepository
    {
        Task<UserDomain?> GetByEmailAsync(Email email);

        Task<UserDomain?> GetByNormalizedEmail(string normalizedEmail);
        Task<UserDomain?> GetByIdAsync(Guid  userId);

        Task AddAsync(UserDomain user);

        Task UpdateAsync(UserDomain user);
    }
}
 