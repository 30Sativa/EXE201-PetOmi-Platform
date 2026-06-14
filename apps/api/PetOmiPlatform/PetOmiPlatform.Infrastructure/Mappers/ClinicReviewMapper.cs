using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class ClinicReviewMapper
    {
        public static ClinicReviewDomain ToDomain(this ClinicReview entity)
        {
            return ClinicReviewDomain.Reconstitute(
                id: entity.ClinicReviewId,
                clinicId: entity.ClinicId,
                ownerUserId: entity.OwnerUserId,
                appointmentId: entity.AppointmentId,
                rating: entity.Rating,
                reviewContent: entity.ReviewContent,
                status: entity.Status,
                rejectionReason: entity.RejectionReason,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt,
                deletedAt: entity.DeletedAt,
                isActive: entity.IsActive
            );
        }

        public static ClinicReview ToEntity(this ClinicReviewDomain domain)
        {
            return new ClinicReview
            {
                ClinicReviewId = domain.Id,
                ClinicId = domain.ClinicId,
                OwnerUserId = domain.OwnerUserId,
                AppointmentId = domain.AppointmentId,
                Rating = domain.Rating,
                ReviewContent = domain.ReviewContent,
                Status = domain.Status,
                RejectionReason = domain.RejectionReason,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt,
                DeletedAt = domain.DeletedAt,
                IsActive = domain.IsActive
            };
        }
    }
}
