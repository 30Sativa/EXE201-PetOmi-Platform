using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Domain.Interfaces.Repositories;

public interface IUserRepository
{
    Task<UserDomain?> GetByEmailAsync(Email email);

    Task<UserDomain?> GetByNormalizedEmail(string normalizedEmail);
    Task<UserDomain?> GetByIdAsync(Guid userId);

    Task AddAsync(UserDomain user);

    Task UpdateAsync(UserDomain user);

    Task<(List<UserDomain> Items, int TotalCount)> GetPagedAsync(string? search, bool? isActive, int page, int pageSize);

    Task<int> CountAllAsync();

    Task<Dictionary<string, int>> GetUserCountByRoleAsync();

    Task<Dictionary<string, int>> GetUserCreatedTrendAsync(int days = 30);

    Task<int> CountByIsActiveAsync(bool isActive);

    Task<List<Guid>> GetAllUserIdsAsync();

    Task<List<Guid>> GetUserIdsByRoleAsync(string roleName);

    Task<(List<UserDomain> Items, int TotalCount)> GetAdminPagedAsync(string? search, bool? isActive, int page, int pageSize);
}
