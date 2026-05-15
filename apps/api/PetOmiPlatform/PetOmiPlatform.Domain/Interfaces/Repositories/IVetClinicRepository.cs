using PetOmiPlatform.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IVetClinicRepository
    {
        Task AddClinicOwnerAsync(Guid vetProfileId, Guid clinicId);
        Task DeactivateByClinicIdAsync(Guid clinicId);
        Task AddAsync(VetClinicDomain vetClinic);
        Task<bool> IsClinicOwnerAsync(Guid userId, Guid clinicId);  // check quyền
        Task<bool> ExistsAsync(Guid vetProfileId, Guid clinicId);   // check trùng

        Task<bool> IsClinicApprovedAsync(Guid clinicId); // check phòng khám đã được duyệt chưa (chỉ vet mới toggle vào clinic được nếu clinic đã được duyệt)
    }
}
