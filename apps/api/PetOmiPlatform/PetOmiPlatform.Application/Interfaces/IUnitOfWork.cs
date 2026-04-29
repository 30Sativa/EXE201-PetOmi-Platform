using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface IUnitOfWork
    {
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}
