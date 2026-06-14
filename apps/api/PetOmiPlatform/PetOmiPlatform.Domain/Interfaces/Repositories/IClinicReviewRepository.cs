using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IClinicReviewRepository
    {
        Task<ClinicReviewDomain?> GetByIdAsync(Guid reviewId);
        Task<List<ClinicReviewDomain>> GetByClinicIdAsync(Guid clinicId);
        Task<List<ClinicReviewDomain>> GetByOwnerIdAsync(Guid ownerUserId);
        Task<bool> HasReviewedAsync(Guid clinicId, Guid ownerUserId);
        Task<(int Count, double Average)> GetClinicStatsAsync(Guid clinicId);
        Task AddAsync(ClinicReviewDomain review);
        Task UpdateAsync(ClinicReviewDomain review);
    }
}
