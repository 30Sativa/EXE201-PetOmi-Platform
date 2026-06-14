using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class ClinicReviewRepository : IClinicReviewRepository
    {
        private readonly PetOmniDbContext _context;

        public ClinicReviewRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<ClinicReviewDomain?> GetByIdAsync(Guid reviewId)
        {
            var entity = await _context.ClinicReviews
                .FirstOrDefaultAsync(r => r.ClinicReviewId == reviewId && r.IsActive);
            return entity?.ToDomain();
        }

        public async Task<List<ClinicReviewDomain>> GetByClinicIdAsync(Guid clinicId)
        {
            var entities = await _context.ClinicReviews
                .Where(r => r.ClinicId == clinicId && r.IsActive && r.Status == "Approved")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<List<ClinicReviewDomain>> GetByOwnerIdAsync(Guid ownerUserId)
        {
            var entities = await _context.ClinicReviews
                .Where(r => r.OwnerUserId == ownerUserId && r.IsActive)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<bool> HasReviewedAsync(Guid clinicId, Guid ownerUserId)
        {
            return await _context.ClinicReviews
                .AnyAsync(r => r.ClinicId == clinicId && r.OwnerUserId == ownerUserId && r.IsActive);
        }

        public async Task<(int Count, double Average)> GetClinicStatsAsync(Guid clinicId)
        {
            var ratings = await _context.ClinicReviews
                .Where(r => r.ClinicId == clinicId && r.IsActive && r.Status == "Approved")
                .Select(r => r.Rating)
                .ToListAsync();

            if (ratings.Count == 0)
                return (0, 0d);

            return (ratings.Count, ratings.Average());
        }

        public async Task AddAsync(ClinicReviewDomain review)
        {
            await _context.ClinicReviews.AddAsync(review.ToEntity());
        }

        public async Task UpdateAsync(ClinicReviewDomain review)
        {
            var entity = await _context.ClinicReviews.FindAsync(review.Id);
            if (entity == null) return;

            var updated = review.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
