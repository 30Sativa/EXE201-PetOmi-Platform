using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Interfaces
{
    public class PetAccessService : IPetAccessService
    {
        private readonly IPetUserAccessRepository _accessRepository;

        public PetAccessService(IPetUserAccessRepository accessRepository)
        {
            _accessRepository = accessRepository;
        }

        public async Task EnsureCanWriteAsync(PetDomain pet, Guid userId, CancellationToken cancellationToken = default)
        {
            if (pet.OwnerUserId == userId) return;

            var access = await _accessRepository.GetByPetAndUserAsync(pet.Id, userId);
            if (access == null || !access.CanWrite())
                throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này.");
        }

        public async Task EnsureCanReadAsync(PetDomain pet, Guid userId, CancellationToken cancellationToken = default)
        {
            if (pet.OwnerUserId == userId) return;

            var access = await _accessRepository.GetByPetAndUserAsync(pet.Id, userId);
            if (access == null || !access.CanRead())
                throw new ForbiddenException("Bạn không có quyền xem thông tin này.");
        }

        public Task EnsureOwnerAsync(PetDomain pet, Guid userId, CancellationToken cancellationToken = default)
        {
            pet.EnsureOwner(userId);
            return Task.CompletedTask;
        }
    }
}
