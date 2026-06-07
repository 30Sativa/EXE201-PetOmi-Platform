using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IVetClinicRepository
    {
        Task AddClinicOwnerAsync(Guid vetProfileId, Guid clinicId);
        Task DeactivateByClinicIdAsync(Guid clinicId);
        Task AddAsync(VetClinicDomain vetClinic);
        Task<bool> IsClinicOwnerAsync(Guid userId, Guid clinicId);
        Task<bool> ExistsAsync(Guid vetProfileId, Guid clinicId);
        Task<bool> IsClinicApprovedAsync(Guid clinicId);
        Task<VetClinicDomain?> GetByUserIdAndClinicIdAsync(Guid userId, Guid clinicId);
        Task<ClinicMembershipDto?> GetActiveMembershipByUserIdAsync(Guid userId, Guid? clinicId = null);
        Task<VetClinicDomain?> GetByVetClinicIdAsync(Guid vetClinicId);
        Task<VetClinicDomain?> GetActiveByVetClinicIdAndClinicIdAsync(Guid vetClinicId, Guid clinicId);
        Task<List<Guid>> GetAllVetClinicIdsAsync(Guid vetProfileId);
        Task UpdateAsync(VetClinicDomain vetClinic);

        /// <summary>Lay danh sach bac si active tai clinic (cho owner chon bac si khi dat lich).</summary>
        Task<List<ClinicDoctorDto>> GetClinicDoctorsAsync(Guid clinicId);
    }

    public class ClinicDoctorDto
    {
        public Guid VetClinicId { get; set; }
        public Guid VetProfileId { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? Specialization { get; set; }
        public string RoleName { get; set; } = null!;
    }

    public class ClinicMembershipDto
    {
        public Guid ClinicId { get; set; }
        public string ClinicName { get; set; } = null!;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? LicenseNumber { get; set; }
        public string? LicenseImageUrl { get; set; }
        public string? LicenseCloudinaryPublicId { get; set; }
        public string? LogoUrl { get; set; }
        public string? LogoCloudinaryPublicId { get; set; }
        public string Status { get; set; } = null!;
        public string? RejectedReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid VetClinicId { get; set; }
        public Guid ClinicRoleId { get; set; }
        public string ClinicRoleName { get; set; } = null!;
        public List<string> ClinicPermissions { get; set; } = new();
    }
}
