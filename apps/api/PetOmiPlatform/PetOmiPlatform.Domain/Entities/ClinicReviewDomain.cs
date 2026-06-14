using System;
using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class ClinicReviewDomain : BaseEntity
    {
        public Guid ClinicId { get; private set; }
        public Guid OwnerUserId { get; private set; }
        public Guid? AppointmentId { get; private set; }
        public int Rating { get; private set; }
        public string ReviewContent { get; private set; } = null!;
        public string Status { get; private set; } = "Approved";
        public string? RejectionReason { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }
        public DateTime? DeletedAt { get; private set; }
        public bool IsActive { get; private set; }

        private ClinicReviewDomain() { }

        public static ClinicReviewDomain Create(
            Guid clinicId,
            Guid ownerUserId,
            int rating,
            string reviewContent,
            Guid? appointmentId = null)
        {
            ValidateRating(rating);
            ValidateContent(reviewContent);

            return new ClinicReviewDomain
            {
                Id = Guid.NewGuid(),
                ClinicId = clinicId,
                OwnerUserId = ownerUserId,
                AppointmentId = appointmentId,
                Rating = rating,
                ReviewContent = reviewContent.Trim(),
                Status = "Approved",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
        }

        public static ClinicReviewDomain Reconstitute(
            Guid id,
            Guid clinicId,
            Guid ownerUserId,
            Guid? appointmentId,
            int rating,
            string reviewContent,
            string status,
            string? rejectionReason,
            DateTime createdAt,
            DateTime? updatedAt,
            DateTime? deletedAt,
            bool isActive)
        {
            return new ClinicReviewDomain
            {
                Id = id,
                ClinicId = clinicId,
                OwnerUserId = ownerUserId,
                AppointmentId = appointmentId,
                Rating = rating,
                ReviewContent = reviewContent,
                Status = status,
                RejectionReason = rejectionReason,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt,
                DeletedAt = deletedAt,
                IsActive = isActive
            };
        }

        public void UpdateContent(int rating, string reviewContent)
        {
            ValidateRating(rating);
            ValidateContent(reviewContent);

            Rating = rating;
            ReviewContent = reviewContent.Trim();
            UpdatedAt = DateTime.UtcNow;
        }

        public void Reject(string reason)
        {
            if (string.IsNullOrWhiteSpace(reason))
                throw new DomainException("Lý do từ chối không được để trống.");

            Status = "Rejected";
            RejectionReason = reason.Trim();
            UpdatedAt = DateTime.UtcNow;
        }

        public void SoftDelete()
        {
            IsActive = false;
            DeletedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        private static void ValidateRating(int rating)
        {
            if (rating < 1 || rating > 5)
                throw new DomainException("Số sao đánh giá phải từ 1 đến 5.");
        }

        private static void ValidateContent(string reviewContent)
        {
            if (string.IsNullOrWhiteSpace(reviewContent))
                throw new DomainException("Nội dung đánh giá không được để trống.");
            if (reviewContent.Trim().Length > 1000)
                throw new DomainException("Nội dung đánh giá không được vượt quá 1000 ký tự.");
        }
    }
}
