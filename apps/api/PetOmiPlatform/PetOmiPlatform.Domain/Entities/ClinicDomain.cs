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
        public ClinicStatus Status { get; private set; }
        public string? RejectedReason { get; private set; }
        public Guid? ReviewedByAdminId { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        // / === Constructors ===
        private ClinicDomain() { }

        private ClinicDomain(string clinicName, string? address, string? phone, string? email, string? licenseNumber)
        {
            Id = Guid.NewGuid();
            ClinicName = clinicName;
            Address = address;
            Phone = phone;
            Email = email;
            LicenseNumber = licenseNumber;
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
                Status = Enum.Parse<ClinicStatus>(status),
                RejectedReason = rejectedReason,
                ReviewedByAdminId = reviewedByAdminId,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        // Factory method for creating a new clinic

        public static ClinicDomain Create(string clinicName, string? address, string? phone, string? email, string? licenseNumber)
        {
            return new ClinicDomain(clinicName, address, phone, email, licenseNumber);
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
            {
                throw new DomainException("Phòng khám này chưa được duyệt.");
            }

        }
    }
}
