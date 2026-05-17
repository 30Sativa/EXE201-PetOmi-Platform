using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPetRepository
    {
        // Lấy pet theo ID (trả về null nếu không tồn tại hoặc đã xóa mềm)
        Task<PetDomain?> GetByIdAsync(Guid petId);

        // Lấy danh sách tất cả pet còn hoạt động của 1 owner
        Task<List<PetDomain>> GetByOwnerIdAsync(Guid ownerUserId);

        // Thêm pet mới
        Task AddAsync(PetDomain pet);

        // Cập nhật thông tin pet
        Task UpdateAsync(PetDomain pet);
    }
}
