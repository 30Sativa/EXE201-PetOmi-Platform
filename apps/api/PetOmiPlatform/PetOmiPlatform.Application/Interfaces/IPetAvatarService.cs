namespace PetOmiPlatform.Application.Interfaces
{
    public interface IPetAvatarService
    {
        Task ReplaceAvatarAsync(
            Guid petId,
            string? newAvatarUrl,
            string? newCloudinaryPublicId,
            CancellationToken cancellationToken = default);
    }
}
