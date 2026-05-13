using System;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IVetClinicRepository
    {
        Task AddClinicOwnerAsync(Guid vetProfileId, Guid clinicId);
    }
}
