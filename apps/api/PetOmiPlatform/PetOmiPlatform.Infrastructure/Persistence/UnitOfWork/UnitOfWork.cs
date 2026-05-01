using Microsoft.EntityFrameworkCore.Storage;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Persistence.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly PetOmniDbContext _context;
        private IDbContextTransaction? _transaction;

        public UnitOfWork(PetOmniDbContext context)
            => _context = context;

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            await _transaction!.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction == null) return;
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
