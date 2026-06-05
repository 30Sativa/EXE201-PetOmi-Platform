namespace PetOmiPlatform.Application.Interfaces
{
    public interface IPetAvatarService
    {
        Task ReplaceAvatarAsync(
            Guid petId,
            string? newAvatarUrl,
            string? newCloudinaryPublicId,
            Guid? selectedPhotoId = null,
            CancellationToken cancellationToken = default);
    }
}
