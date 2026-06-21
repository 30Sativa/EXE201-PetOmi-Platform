using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Common.Models;
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
    public class PetRepository : IPetRepository
    {
        private readonly PetOmniDbContext _context;

        public PetRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        // Lấy pet theo ID — chỉ trả về nếu còn IsActive (chưa xóa mềm)
        public async Task<PetDomain?> GetByIdAsync(Guid petId)
        {
            var entity = await _context.Pets
                .FirstOrDefaultAsync(p => p.PetId == petId && p.IsActive);
            return entity?.ToDomain();
        }

        // Lấy toàn bộ pet còn hoạt động của 1 owner, sắp xếp mới nhất lên đầu
        public async Task<List<PetDomain>> GetByOwnerIdAsync(Guid ownerUserId)
        {
            var entities = await _context.Pets
                .Where(p => p.OwnerUserId == ownerUserId && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return entities.Select(e => e.ToDomain()).ToList();
        }

        // Thêm pet mới vào DB
        public async Task<List<ClinicPetSearchResult>> SearchByClinicAsync(Guid clinicId, string? search, int limit)
        {
            var take = Math.Clamp(limit, 1, 50);
            var query = _context.Pets
                .AsNoTracking()
                .Where(p =>
                    p.IsActive &&
                    p.OwnerUser.IsActive &&
                    p.Appointments.Any(a => a.ClinicId == clinicId));

            var keyword = search?.Trim();
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var like = $"%{keyword}%";
                var normalizedKeyword = keyword.Replace("-", string.Empty);
                var normalizedLike = $"%{normalizedKeyword}%";

                query = query.Where(p =>
                    (p.PublicPetCode != null && (
                        EF.Functions.Like(p.PublicPetCode, like) ||
                        EF.Functions.Like(p.PublicPetCode.Replace("-", string.Empty), normalizedLike))) ||
                    EF.Functions.Like(p.PetId.ToString(), like) ||
                    EF.Functions.Like(p.PetId.ToString().Replace("-", string.Empty), normalizedLike) ||
                    EF.Functions.Like(p.Name, like) ||
                    EF.Functions.Like(p.Species, like) ||
                    (p.Breed != null && EF.Functions.Like(p.Breed, like)) ||
                    (p.Gender != null && EF.Functions.Like(p.Gender, like)) ||
                    EF.Functions.Like(p.OwnerUser.Email, like) ||
                    (p.OwnerUser.UserProfile != null && p.OwnerUser.UserProfile.FullName != null && EF.Functions.Like(p.OwnerUser.UserProfile.FullName, like)) ||
                    (p.OwnerUser.UserProfile != null && p.OwnerUser.UserProfile.Phone != null && EF.Functions.Like(p.OwnerUser.UserProfile.Phone, like)));
            }

            return await query
                .OrderByDescending(p => p.Appointments
                    .Where(a => a.ClinicId == clinicId)
                    .Max(a => (DateOnly?)a.AppointmentDate))
                .ThenBy(p => p.Name)
                .Take(take)
                .Select(p => new ClinicPetSearchResult
                {
                    PetId = p.PetId,
                    OwnerUserId = p.OwnerUserId,
                    PublicPetCode = p.PublicPetCode,
                    PetName = p.Name,
                    Species = p.Species,
                    Breed = p.Breed,
                    Gender = p.Gender,
                    AvatarUrl = p.AvatarUrl,
                    OwnerEmail = p.OwnerUser.Email,
                    OwnerFullName = p.OwnerUser.UserProfile != null ? p.OwnerUser.UserProfile.FullName : null,
                    OwnerPhone = p.OwnerUser.UserProfile != null ? p.OwnerUser.UserProfile.Phone : null,
                    LastAppointmentDate = p.Appointments
                        .Where(a => a.ClinicId == clinicId)
                        .OrderByDescending(a => a.AppointmentDate)
                        .ThenByDescending(a => a.StartTime)
                        .Select(a => (DateOnly?)a.AppointmentDate)
                        .FirstOrDefault(),
                    LastAppointmentStatus = p.Appointments
                        .Where(a => a.ClinicId == clinicId)
                        .OrderByDescending(a => a.AppointmentDate)
                        .ThenByDescending(a => a.StartTime)
                        .Select(a => a.Status)
                        .FirstOrDefault()
                })
                .ToListAsync();
        }

        public async Task<bool> PublicPetCodeExistsAsync(string publicPetCode)
        {
            var normalizedCode = publicPetCode.Trim().ToUpper();
            return await _context.Pets
                .AnyAsync(p => p.PublicPetCode == normalizedCode);
        }

        public async Task AddAsync(PetDomain pet)
        {
            await _context.Pets.AddAsync(pet.ToEntity());
        }

        public async Task UpdateAsync(PetDomain pet)
        {
            var entity = await _context.Pets.FindAsync(pet.Id);
            if (entity == null) return;

            var updated = pet.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
