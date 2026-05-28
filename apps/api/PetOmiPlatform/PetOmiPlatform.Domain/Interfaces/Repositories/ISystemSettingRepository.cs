using PetOmiPlatform.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface ISystemSettingRepository
    {
        Task<List<SystemSettingDomain>> GetAllAsync();
        Task<List<SystemSettingDomain>> GetByCategoryAsync(string category);
        Task<SystemSettingDomain?> GetByKeyAsync(string key);
        Task UpsertAsync(SystemSettingDomain setting);
    }
}
