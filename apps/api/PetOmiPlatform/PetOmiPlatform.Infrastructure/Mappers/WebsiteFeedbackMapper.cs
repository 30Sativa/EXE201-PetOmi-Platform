using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class WebsiteFeedbackMapper
    {
        public static WebsiteFeedbackDomain ToDomain(this WebsiteFeedback entity)
        {
            return WebsiteFeedbackDomain.Reconstitute(
                id: entity.WebsiteFeedbackId,
                userId: entity.UserId,
                category: entity.Category,
                rating: entity.Rating,
                subject: entity.Subject,
                message: entity.Message,
                pageUrl: entity.PageUrl,
                browserInfo: entity.BrowserInfo,
                status: entity.Status,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt,
                isActive: entity.IsActive);
        }

        public static WebsiteFeedback ToEntity(this WebsiteFeedbackDomain domain)
        {
            return new WebsiteFeedback
            {
                WebsiteFeedbackId = domain.Id,
                UserId = domain.UserId,
                Category = domain.Category,
                Rating = domain.Rating,
                Subject = domain.Subject,
                Message = domain.Message,
                PageUrl = domain.PageUrl,
                BrowserInfo = domain.BrowserInfo,
                Status = domain.Status,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt,
                IsActive = domain.IsActive
            };
        }
    }
}
