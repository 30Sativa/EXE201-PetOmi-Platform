using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class UserRoleRepository : IUserRoleRepository
    {
        private readonly PetOmniDbContext _context;

        public UserRoleRepository(PetOmniDbContext context)
        {
            _context = context;
        }


        public async Task AddAsync(Guid userId, Guid roleId)
        {
            var userRole = new UserRole
            {
                UserId = userId,
                RoleId = roleId
            };

            await _context.UserRoles.AddAsync(userRole);
        }
    }
}
