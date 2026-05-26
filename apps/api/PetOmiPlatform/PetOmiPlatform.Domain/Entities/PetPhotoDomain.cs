using PetOmiPlatform.Domain.Common;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class PetPhotoDomain : BaseEntity
    {
        public Guid PetId { get; private set; }
        public string ImageUrl { get; private set; }
        public string? CloudinaryPublicId { get; private set; }
        public string? Caption { get; private set; }
        public bool IsAvatar { get; private set; }
        public DateTime? TakenAt { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }
        public DateTime? DeletedAt { get; private set; }
        public bool IsActive { get; private set; }

        private PetPhotoDomain() { }

        private PetPhotoDomain(
            Guid petId,
            string imageUrl,
            string? cloudinaryPublicId,
            string? caption,
            bool isAvatar,
            DateTime? takenAt)
        {
            Id = Guid.NewGuid();
            PetId = petId;
            ImageUrl = imageUrl;
            CloudinaryPublicId = cloudinaryPublicId;
            Caption = caption;
            IsAvatar = isAvatar;
            TakenAt = takenAt;
            IsActive = true;
            CreatedAt = DateTime.UtcNow;
        }

        public static PetPhotoDomain Create(
            Guid petId,
            string imageUrl,
            string? cloudinaryPublicId,
            string? caption,
            bool isAvatar,
            DateTime? takenAt)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                throw new Domain.Exceptions.DomainException("URL ảnh không được để trống.");
            if (!takenAt.HasValue)
                throw new Domain.Exceptions.DomainException("Ngày chụp là bắt buộc.");
            if (takenAt.Value.Date > DateTime.UtcNow.Date)
                throw new Domain.Exceptions.DomainException("Ngày chụp không được là ngày trong tương lai.");
            return new PetPhotoDomain(petId, imageUrl, cloudinaryPublicId, caption, isAvatar, takenAt);
        }

        public static PetPhotoDomain Reconstitute(
            Guid id,
            Guid petId,
            string imageUrl,
            string? cloudinaryPublicId,
            string? caption,
            bool isAvatar,
            DateTime? takenAt,
            DateTime createdAt,
            DateTime? deletedAt,
            bool isActive)
        {
            return new PetPhotoDomain
            {
                Id = id,
                PetId = petId,
                ImageUrl = imageUrl,
                CloudinaryPublicId = cloudinaryPublicId,
                Caption = caption,
                IsAvatar = isAvatar,
                TakenAt = takenAt,
                CreatedAt = createdAt,
                DeletedAt = deletedAt,
                IsActive = isActive
            };
        }

        public void SetAsAvatar()
        {
            IsAvatar = true;
            UpdatedAt = DateTime.UtcNow;
        }

        public void RemoveAvatar()
        {
            IsAvatar = false;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateCaption(string? caption)
        {
            if (caption != null) Caption = caption;
            UpdatedAt = DateTime.UtcNow;
        }

        public void SoftDelete()
        {
            if (!IsActive)
                throw new Domain.Exceptions.DomainException("Ảnh này đã bị xóa trước đó.");
            IsActive = false;
            DeletedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
