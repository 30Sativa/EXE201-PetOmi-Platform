using System;

namespace PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response
{
    public class PetHealthShareResponse
    {
        public Guid ShareTokenId { get; set; }
        public Guid PetId { get; set; }
        public Guid OwnerUserId { get; set; }
        public Guid? ClinicId { get; set; }
        public string DisplayCode { get; set; } = null!;
        public string Scope { get; set; } = null!;
        public string AccessMode { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public int? MaxUses { get; set; }
        public int UsedCount { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid CreatedByUserId { get; set; }
        public string? Note { get; set; }
        public bool IsExpired { get; set; }
        public bool IsRevoked { get; set; }
        public bool HasReachedMaxUses { get; set; }
    }
}
