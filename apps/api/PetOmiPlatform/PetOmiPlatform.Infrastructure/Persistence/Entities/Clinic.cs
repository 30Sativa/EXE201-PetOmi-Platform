using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Clinic
{
    public Guid ClinicId { get; set; }

    public string ClinicName { get; set; } = null!;

    public string? Address { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? LicenseNumber { get; set; }

    public string? LicenseImageUrl { get; set; }  // URL ảnh Giấy phép kinh doanh

    public string? LogoUrl { get; set; }           // Logo phòng khám

    public string? Description { get; set; }       // Mô tả ngắn

    public string? OpeningHours { get; set; }      // JSON: {"Mon-Fri":"08:00-17:00"}

    public string Status { get; set; } = null!;

    public string? RejectedReason { get; set; }

    public Guid? ReviewedByAdminId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? ReviewedByAdmin { get; set; }

    public virtual ICollection<ClinicService> ClinicServices { get; set; } = new List<ClinicService>();

<<<<<<< Updated upstream
=======
    public virtual ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();

>>>>>>> Stashed changes
    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();

    public virtual ICollection<VetClinic> VetClinics { get; set; } = new List<VetClinic>();
}
