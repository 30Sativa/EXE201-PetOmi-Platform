using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Entities
{
    public class ClinicDomain : BaseEntity
    {
        public string ClinicName { get; private set; }
        public string? Address { get; private set; }
        public string? Phone { get; private set; }
        public string? Email { get; private set; }
        public string? LicenseNumber { get; private set; }
        public string? LicenseImageUrl { get; private set; }  // URL ảnh Giấy phép kinh doanh
        public string? LogoUrl { get; private set; }          // Logo phòng khám
        public string? Description { get; private set; }      // Mô tả ngắn
        public string? OpeningHours { get; private set; }     // JSON: {"Mon-Fri":"08:00-17:00",...}
        public ClinicStatus Status { get; private set; }
        public string? RejectedReason { get; private set; }
        public Guid? ReviewedByAdminId { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        // / === Constructors ===
        private ClinicDomain() { }

        private ClinicDomain(string clinicName, string? address, string? phone, string? email, string? licenseNumber, string? licenseImageUrl)
        {
            Id = Guid.NewGuid();
            ClinicName = clinicName;
            Address = address;
            Phone = phone;
            Email = email;
            LicenseNumber = licenseNumber;
            LicenseImageUrl = licenseImageUrl;
            Status = ClinicStatus.Pending;
            CreatedAt = DateTime.UtcNow;
        }

        //reconstitution constructor
        public static ClinicDomain Reconstitute(
        Guid id,
        string clinicName,
        string? address,
        string? phone,
        string? email,
        string? licenseNumber,
        string? licenseImageUrl,
        string? logoUrl,
        string? description,
        string? openingHours,
        string status,
        string? rejectedReason,
        Guid? reviewedByAdminId,
        DateTime createdAt,
        DateTime? updatedAt)
        {
            return new ClinicDomain
            {
                Id = id,
                ClinicName = clinicName,
                Address = address,
                Phone = phone,
                Email = email,
                LicenseNumber = licenseNumber,
                LicenseImageUrl = licenseImageUrl,
                LogoUrl = logoUrl,
                Description = description,
                OpeningHours = openingHours,
                Status = Enum.Parse<ClinicStatus>(status),
                RejectedReason = rejectedReason,
                ReviewedByAdminId = reviewedByAdminId,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        // Factory method for creating a new clinic

        public static ClinicDomain Create(string clinicName, string? address, string? phone, string? email, string? licenseNumber, string? licenseImageUrl)
        {
            return new ClinicDomain(clinicName, address, phone, email, licenseNumber, licenseImageUrl);
        }

        // behavior methods for updating clinic status

        public void Approve(Guid adminId)
        {
            if (Status != ClinicStatus.Pending)
            {
                throw new DomainException("Chỉ có thể duyệt một phòng khám đang chờ duyệt.");
            }
            Status = ClinicStatus.Approved;
            ReviewedByAdminId = adminId;
            UpdatedAt = DateTime.UtcNow;
        }


        public void Reject(Guid adminId, string reason)
        {
            if (Status != ClinicStatus.Pending)
            {
                throw new DomainException("Chỉ có thể từ chối một phòng khám đang chờ duyệt.");
            }
            if (string.IsNullOrWhiteSpace(reason))
            {
                throw new DomainException("Lý do từ chối không được để trống.");
            }
            Status = ClinicStatus.Rejected;
            RejectedReason = reason;
            ReviewedByAdminId = adminId;
            UpdatedAt = DateTime.UtcNow;
        }

        public void EnsureApproved()
        {
            if (Status != ClinicStatus.Approved)
                throw new DomainException("Phòng khám này chưa được duyệt.");
        }

        /// <summary>
        /// ClinicOwner cập nhật thông tin phòng khám sau khi được Approved.
        /// </summary>
        public void UpdateInfo(string? clinicName, string? address, string? phone,
            string? email, string? logoUrl, string? description, string? openingHours)
        {
            EnsureApproved();

            if (!string.IsNullOrWhiteSpace(clinicName)) ClinicName = clinicName;
            if (address != null) Address = address;
            if (phone != null) Phone = phone;
            if (email != null) Email = email;
            if (logoUrl != null) LogoUrl = logoUrl;
            if (description != null) Description = description;
            if (openingHours != null) OpeningHours = openingHours;

            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Chủ phòng khám re-apply sau khi bị Reject — reset về Pending, xóa lý do từ chối.
        /// </summary>
        public void Resubmit(string? newLicenseNumber, string? newLicenseImageUrl)
        {
            if (Status != ClinicStatus.Rejected)
                throw new DomainException("Chỉ có thể nộp lại phòng khám đã bị từ chối.");

            if (!string.IsNullOrWhiteSpace(newLicenseNumber))
                LicenseNumber = newLicenseNumber;

            if (!string.IsNullOrWhiteSpace(newLicenseImageUrl))
                LicenseImageUrl = newLicenseImageUrl;

            Status = ClinicStatus.Pending;
            RejectedReason = null;
            ReviewedByAdminId = null;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
