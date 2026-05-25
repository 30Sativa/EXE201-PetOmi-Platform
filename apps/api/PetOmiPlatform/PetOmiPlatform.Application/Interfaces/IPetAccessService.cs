using PetOmiPlatform.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface IPetAccessService
    {
        Task EnsureCanReadAsync(PetDomain pet, Guid userId, CancellationToken cancellationToken = default);
        Task EnsureCanWriteAsync(PetDomain pet, Guid userId, CancellationToken cancellationToken = default);
        Task EnsureOwnerAsync(PetDomain pet, Guid userId, CancellationToken cancellationToken = default);
    }
}
