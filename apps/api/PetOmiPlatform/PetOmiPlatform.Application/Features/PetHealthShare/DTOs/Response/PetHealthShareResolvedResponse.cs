namespace PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response
{
    public class PetHealthShareResolvedResponse
    {
        public Guid PetId { get; set; }
        public string? PublicPetCode { get; set; }
        public string PetName { get; set; } = null!;
        public string Scope { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
    }
}
