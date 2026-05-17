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
        public async Task AddAsync(PetDomain pet)
        {
            await _context.Pets.AddAsync(pet.ToEntity());
        }

        // Cập nhật thông tin pet — tìm entity theo ID rồi ghi đè từng field
        public async Task UpdateAsync(PetDomain pet)
        {
            var entity = await _context.Pets.FindAsync(pet.Id);
            if (entity == null) return;

            entity.Name = pet.Name;
            entity.Species = pet.Species;
            entity.Breed = pet.Breed;
            entity.Gender = pet.Gender;
            entity.IsNeutered = pet.IsNeutered;
            entity.DateOfBirth = pet.DateOfBirth;
            entity.IsBirthDateEstimated = pet.IsBirthDateEstimated;
            entity.AvatarUrl = pet.AvatarUrl;
            entity.Color = pet.Color;
            entity.IsActive = pet.IsActive;
            entity.DeletedAt = pet.DeletedAt;
            entity.UpdatedAt = pet.UpdatedAt;
        }
    }
}
