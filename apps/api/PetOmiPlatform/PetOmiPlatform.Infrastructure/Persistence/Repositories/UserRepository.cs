using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.ValueObjects;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly PetOmniDbContext _context;

        public UserRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(UserDomain user)
        {
            var entity = user.ToEntity();
            await _context.Users.AddAsync(entity);
        }

        public async Task<UserDomain?> GetByEmailAsync(Email email)
        {
            var entity = await _context.Users.FirstOrDefaultAsync(u => u.Email == email.Value);
            return entity?.ToDomain();
        }

        public async Task<UserDomain?> GetByIdAsync(Guid userId)
        {
            var entity = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId);
            return entity?.ToDomain();
        }

        public async Task<UserDomain?> GetByNormalizedEmail(string normalizedEmail)
        {
            var entity = await _context.Users.FirstOrDefaultAsync(e => e.NormalizedEmail == normalizedEmail);
            return entity?.ToDomain();
        }

        public async Task UpdateAsync(UserDomain user)
        {
            var entity = await _context.Users.FindAsync(user.Id);
            if (entity == null) return;

            var updated = user.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
            entity.NormalizedEmail = user.Email.NormalizedValue;
        }

        public async Task<(List<UserDomain> Items, int TotalCount)> GetPagedAsync(
            string? search, bool? isActive, int page, int pageSize)
        {
            var query = _context.Users.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(u =>
                    u.Email.ToLower().Contains(term) ||
                    (u.UserProfile != null && u.UserProfile.FullName != null && u.UserProfile.FullName.ToLower().Contains(term)));
            }

            if (isActive.HasValue)
                query = query.Where(u => u.IsActive == isActive.Value);

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => u.ToDomain())
                .ToListAsync();

            return (items, total);
        }

        public async Task<int> CountAllAsync()
        {
            return await _context.Users.AsNoTracking().CountAsync();
        }

        public async Task<Dictionary<string, int>> GetUserCountByRoleAsync()
        {
            return await _context.UserRoles
                .GroupBy(ur => ur.Role!.RoleName)
                .Select(g => new { Role = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Role, x => x.Count);
        }

        public async Task<Dictionary<string, int>> GetUserCreatedTrendAsync(int days = 30)
        {
            var startDate = DateTime.UtcNow.AddDays(-days).Date;

            var data = await _context.Users
                .Where(u => u.CreatedAt >= startDate)
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var result = new Dictionary<string, int>();
            for (int i = days; i >= 0; i--)
            {
                var date = DateTime.UtcNow.Date.AddDays(-i);
                var key = date.ToString("yyyy-MM-dd");
                result[key] = data.FirstOrDefault(d => d.Date == date)?.Count ?? 0;
            }

            return result;
        }

        public async Task<int> CountByIsActiveAsync(bool isActive)
        {
            return await _context.Users.CountAsync(u => u.IsActive == isActive);
        }

        public async Task<int> CountByEmailVerifiedAsync(bool emailVerified)
        {
            return await _context.Users.CountAsync(u => u.EmailVerified == emailVerified);
        }

        public async Task<List<Guid>> GetAllUserIdsAsync()
        {
            return await _context.Users
                .Select(u => u.UserId)
                .ToListAsync();
        }

        public async Task<List<Guid>> GetUserIdsByRoleAsync(string roleName)
        {
            return await _context.UserRoles
                .Where(ur => ur.Role!.RoleName == roleName)
                .Select(ur => ur.UserId)
                .ToListAsync();
        }

        public async Task<(List<UserDomain> Items, int TotalCount)> GetAdminPagedAsync(
            string? search, bool? isActive, int page, int pageSize)
        {
            var query = _context.Users.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(u =>
                    u.Email.ToLower().Contains(term) ||
                    (u.UserProfile != null && u.UserProfile.FullName != null && u.UserProfile.FullName.ToLower().Contains(term)));
            }

            if (isActive.HasValue)
                query = query.Where(u => u.IsActive == isActive.Value);

            var total = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => u.ToDomain())
                .ToListAsync();

            return (users, total);
        }
    }
}
