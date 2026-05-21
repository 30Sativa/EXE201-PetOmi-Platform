using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IClinicRepository
    {
        Task AddAsync(ClinicDomain clinic);
        Task<ClinicDomain?> GetByIdAsync(Guid clinicId);
        Task<bool> ExistsByLicenseNumberAsync(string licenseNumber);
        Task UpdateAsync(ClinicDomain clinic);

        /// <summary>Lấy danh sách clinic theo status, có phân trang — Admin dùng.</summary>
        Task<(IEnumerable<ClinicDomain> Items, int TotalCount)> GetByStatusAsync(string status, int page, int pageSize);

        /// <summary>Lấy clinic mà user này là ClinicOwner (qua VetClinic).</summary>
        Task<ClinicDomain?> GetByOwnerUserIdAsync(Guid userId);
    }
}
