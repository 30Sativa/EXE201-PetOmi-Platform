using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface IPetAvatarService
    {
        Task<List<string>> SetAvatarAsync(
            Guid petId,
            string imageUrl,
            string? cloudinaryPublicId,
            CancellationToken cancellationToken = default);
    }
}
