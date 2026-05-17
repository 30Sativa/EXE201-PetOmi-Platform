using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IExternalLoginRepository
    {
        Task<Guid?> GetUserIdByProviderAsync(string provider, string providerKey);
        Task AddAsync(Guid userId, string provider, string providerKey, string? email);
    }
}
