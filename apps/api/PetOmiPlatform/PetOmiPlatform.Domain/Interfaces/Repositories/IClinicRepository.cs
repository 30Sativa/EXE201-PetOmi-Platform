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
    }
}
