using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class ClinicDomain : BaseEntity
    {
        public string ClinicName { get; private set; } = null!;
        public string? Address { get; private set; }
        public string? Phone { get; private set; }
        public string? Email { get; private set; }
        public string? LicenseNumber { get; private set; }
        public string? LicenseImageUrl { get; private set; }
        public string? LicenseCloudinaryPublicId { get; private set; }
        public string? LogoUrl { get; private set; }
        public string? LogoCloudinaryPublicId { get; private set; }
        public string? Description { get; private set; }
        public string? OpeningHours { get; private set; }
        public double? Latitude { get; private set; }
        public double? Longitude { get; private set; }
        public int AppointmentBufferMins { get; private set; }
        public ClinicStatus Status { get; private set; }
        public string? RejectedReason { get; private set; }
        public Guid? ReviewedByAdminId { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private ClinicDomain() { }

        private ClinicDomain(
            string clinicName,
            string? address,
            string? phone,
            string? email,
            string? licenseNumber,
            string? licenseImageUrl,
            string? licenseCloudinaryPublicId,
            string? logoUrl,
            string? logoCloudinaryPublicId,
            double? latitude,
            double? longitude,
            int appointmentBufferMins)
        {
            Id = Guid.NewGuid();
            ClinicName = clinicName;
            Address = address;
            Phone = phone;
            Email = email;
            LicenseNumber = licenseNumber;
            LicenseImageUrl = licenseImageUrl;
            LicenseCloudinaryPublicId = licenseCloudinaryPublicId;
            LogoUrl = logoUrl;
            LogoCloudinaryPublicId = logoCloudinaryPublicId;
            Latitude = latitude;
            Longitude = longitude;
            AppointmentBufferMins = appointmentBufferMins;
            Status = ClinicStatus.Pending;
            CreatedAt = DateTime.UtcNow;
        }

        public static ClinicDomain Reconstitute(
            Guid id,
            string clinicName,
            string? address,
            string? phone,
            string? email,
            string? licenseNumber,
            string? licenseImageUrl,
            string? licenseCloudinaryPublicId,
            string? logoUrl,
            string? logoCloudinaryPublicId,
            string? description,
            string? openingHours,
            string status,
            string? rejectedReason,
            Guid? reviewedByAdminId,
            DateTime createdAt,
            DateTime? updatedAt,
            double? latitude,
            double? longitude,
            int appointmentBufferMins)
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
                LicenseCloudinaryPublicId = licenseCloudinaryPublicId,
                LogoUrl = logoUrl,
                LogoCloudinaryPublicId = logoCloudinaryPublicId,
                Description = description,
                OpeningHours = openingHours,
                Latitude = latitude,
                Longitude = longitude,
                AppointmentBufferMins = appointmentBufferMins,
                Status = Enum.Parse<ClinicStatus>(status),
                RejectedReason = rejectedReason,
                ReviewedByAdminId = reviewedByAdminId,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        public static ClinicDomain Create(
            string clinicName,
            string? address,
            string? phone,
            string? email,
            string? licenseNumber,
            string? licenseImageUrl,
            string? licenseCloudinaryPublicId,
            string? logoUrl = null,
            string? logoCloudinaryPublicId = null,
            double? latitude = null,
            double? longitude = null,
            int appointmentBufferMins = 0)
        {
            return new ClinicDomain(
                clinicName,
                address,
                phone,
                email,
                licenseNumber,
                licenseImageUrl,
                licenseCloudinaryPublicId,
                logoUrl,
                logoCloudinaryPublicId,
                latitude,
                longitude,
                appointmentBufferMins);
        }

        public void Approve(Guid adminId)
        {
            if (Status != ClinicStatus.Pending)
                throw new DomainException("Chi co the duyet phong kham dang cho duyet.");

            Status = ClinicStatus.Approved;
            ReviewedByAdminId = adminId;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Reject(Guid adminId, string reason)
        {
            if (Status != ClinicStatus.Pending)
                throw new DomainException("Chi co the tu choi phong kham dang cho duyet.");
            if (string.IsNullOrWhiteSpace(reason))
                throw new DomainException("Ly do tu choi khong duoc de trong.");

            Status = ClinicStatus.Rejected;
            RejectedReason = reason;
            ReviewedByAdminId = adminId;
            UpdatedAt = DateTime.UtcNow;
        }

        public void EnsureApproved()
        {
            if (Status != ClinicStatus.Approved)
                throw new DomainException("Phong kham nay chua duoc duyet.");
        }

        public void UpdateInfo(
            string? clinicName,
            string? address,
            string? phone,
            string? email,
            string? logoUrl,
            string? logoCloudinaryPublicId,
            string? description,
            string? openingHours)
        {
            EnsureApproved();

            if (!string.IsNullOrWhiteSpace(clinicName)) ClinicName = clinicName;
            if (address != null) Address = address;
            if (phone != null) Phone = phone;
            if (email != null) Email = email;
            if (logoUrl != null) LogoUrl = logoUrl;
            if (logoCloudinaryPublicId != null) LogoCloudinaryPublicId = logoCloudinaryPublicId;
            if (description != null) Description = description;
            if (openingHours != null) OpeningHours = openingHours;

            UpdatedAt = DateTime.UtcNow;
        }

        public void Resubmit(string? newLicenseNumber, string? newLicenseImageUrl, string? newLicenseCloudinaryPublicId)
        {
            if (Status != ClinicStatus.Rejected)
                throw new DomainException("Chi co the nop lai phong kham da bi tu choi.");

            if (!string.IsNullOrWhiteSpace(newLicenseNumber))
                LicenseNumber = newLicenseNumber;

            if (!string.IsNullOrWhiteSpace(newLicenseImageUrl))
            {
                LicenseImageUrl = newLicenseImageUrl;
                LicenseCloudinaryPublicId = newLicenseCloudinaryPublicId;
            }

            Status = ClinicStatus.Pending;
            RejectedReason = null;
            ReviewedByAdminId = null;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateLocation(double? latitude, double? longitude, int? appointmentBufferMins)
        {
            if (latitude.HasValue)
            {
                if (latitude < -90 || latitude > 90)
                    throw new DomainException("Latitude phai nam trong khoang -90 den 90.");
                Latitude = latitude;
            }

            if (longitude.HasValue)
            {
                if (longitude < -180 || longitude > 180)
                    throw new DomainException("Longitude phai nam trong khoang -180 den 180.");
                Longitude = longitude;
            }

            if (appointmentBufferMins.HasValue)
            {
                if (appointmentBufferMins < 0 || appointmentBufferMins > 60)
                    throw new DomainException("Buffer time phai nam trong khoang 0 den 60 phut.");
                AppointmentBufferMins = appointmentBufferMins.Value;
            }

            UpdatedAt = DateTime.UtcNow;
        }
    }
}
