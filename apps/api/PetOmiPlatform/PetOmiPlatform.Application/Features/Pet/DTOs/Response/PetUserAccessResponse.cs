using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Response
{
    public class PetUserAccessResponse
    {
        public Guid PetUserAccessId { get; set; }
        public Guid PetId { get; set; }
        public Guid UserId { get; set; }
        public string AccessRole { get; set; } = null!;
        public Guid? GrantedByUserId { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IsExpired { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
