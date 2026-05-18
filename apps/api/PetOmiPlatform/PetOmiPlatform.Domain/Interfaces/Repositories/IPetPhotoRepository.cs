using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPetPhotoRepository
    {
        Task<PetPhotoDomain?> GetByIdAsync(Guid photoId);
        Task<PetPhotoDomain?> GetAvatarAsync(Guid petId);
        Task<List<PetPhotoDomain>> GetByPetIdAsync(Guid petId);
        Task AddAsync(PetPhotoDomain photo);
        Task UpdateAsync(PetPhotoDomain photo);
        Task DeleteAsync(Guid photoId);
    }
}
