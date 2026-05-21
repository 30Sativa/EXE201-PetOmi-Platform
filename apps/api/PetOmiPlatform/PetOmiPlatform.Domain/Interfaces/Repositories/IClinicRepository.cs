using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IClinicRepository
    {
        Task AddAsync(ClinicDomain clinic);
        Task<ClinicDomain?> GetByIdAsync(Guid clinicId);

        /// <summary>Lấy clinic mà user này là ClinicOwner (qua VetClinic).</summary>
        Task<ClinicDomain?> GetByOwnerUserIdAsync(Guid userId);

        Task<bool> ExistsByLicenseNumberAsync(string licenseNumber);

        /// <summary>Lấy danh sách clinic theo status, có phân trang — Admin dùng.</summary>
        Task<IEnumerable<ClinicDomain>> GetByStatusAsync(string status, int page, int pageSize);

        Task<int> CountByStatusAsync(string status);

        Task UpdateAsync(ClinicDomain clinic);
    }
}
