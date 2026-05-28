using PetOmiPlatform.Domain.Entities;
using System;

namespace PetOmiPlatform.Domain.Interfaces.Repositories;

public interface IClinicRepository
{
    Task AddAsync(ClinicDomain clinic);
    Task<ClinicDomain?> GetByIdAsync(Guid clinicId);

    Task<ClinicDomain?> GetByOwnerUserIdAsync(Guid userId);

    Task<bool> ExistsByLicenseNumberAsync(string licenseNumber);

    Task<IEnumerable<ClinicDomain>> GetByStatusAsync(string status, int page, int pageSize);

    Task<int> CountByStatusAsync(string status);

    Task UpdateAsync(ClinicDomain clinic);

    Task<(List<ClinicDomain> Items, int TotalCount)> SearchAsync(
        double? userLat, double? userLng,
        string? keyword, string? city,
        int radiusKm, int page, int pageSize);

    Task<int> GetBufferMinsAsync(Guid clinicId);

    Task<Dictionary<string, int>> GetClinicCountByStatusAsync();

    Task<Dictionary<string, int>> GetClinicCreatedTrendAsync(int days = 30);
}
