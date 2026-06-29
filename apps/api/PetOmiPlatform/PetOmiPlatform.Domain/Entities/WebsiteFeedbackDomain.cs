using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class WebsiteFeedbackDomain : BaseEntity
    {
        public Guid UserId { get; private set; }
        public string Category { get; private set; } = "General";
        public int? Rating { get; private set; }
        public string Subject { get; private set; } = null!;
        public string Message { get; private set; } = null!;
        public string? PageUrl { get; private set; }
        public string? BrowserInfo { get; private set; }
        public string Status { get; private set; } = "New";
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }
        public bool IsActive { get; private set; }

        private WebsiteFeedbackDomain() { }

        public static WebsiteFeedbackDomain Create(
            Guid userId,
            string category,
            int? rating,
            string subject,
            string message,
            string? pageUrl,
            string? browserInfo)
        {
            Validate(category, rating, subject, message, pageUrl, browserInfo);

            return new WebsiteFeedbackDomain
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Category = category.Trim(),
                Rating = rating,
                Subject = subject.Trim(),
                Message = message.Trim(),
                PageUrl = string.IsNullOrWhiteSpace(pageUrl) ? null : pageUrl.Trim(),
                BrowserInfo = string.IsNullOrWhiteSpace(browserInfo) ? null : browserInfo.Trim(),
                Status = "New",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
        }

        public static WebsiteFeedbackDomain Reconstitute(
            Guid id,
            Guid userId,
            string category,
            int? rating,
            string subject,
            string message,
            string? pageUrl,
            string? browserInfo,
            string status,
            DateTime createdAt,
            DateTime? updatedAt,
            bool isActive)
        {
            return new WebsiteFeedbackDomain
            {
                Id = id,
                UserId = userId,
                Category = category,
                Rating = rating,
                Subject = subject,
                Message = message,
                PageUrl = pageUrl,
                BrowserInfo = browserInfo,
                Status = status,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt,
                IsActive = isActive
            };
        }

        private static void Validate(
            string category,
            int? rating,
            string subject,
            string message,
            string? pageUrl,
            string? browserInfo)
        {
            if (string.IsNullOrWhiteSpace(category))
                throw new DomainException("Loai feedback khong duoc de trong.");
            if (category.Trim().Length > 50)
                throw new DomainException("Loai feedback khong duoc vuot qua 50 ky tu.");
            if (rating is < 1 or > 5)
                throw new DomainException("Diem danh gia phai tu 1 den 5.");
            if (string.IsNullOrWhiteSpace(subject))
                throw new DomainException("Tieu de feedback khong duoc de trong.");
            if (subject.Trim().Length > 150)
                throw new DomainException("Tieu de feedback khong duoc vuot qua 150 ky tu.");
            if (string.IsNullOrWhiteSpace(message))
                throw new DomainException("Noi dung feedback khong duoc de trong.");
            if (message.Trim().Length > 2000)
                throw new DomainException("Noi dung feedback khong duoc vuot qua 2000 ky tu.");
            if (!string.IsNullOrWhiteSpace(pageUrl) && pageUrl.Trim().Length > 500)
                throw new DomainException("Duong dan trang khong duoc vuot qua 500 ky tu.");
            if (!string.IsNullOrWhiteSpace(browserInfo) && browserInfo.Trim().Length > 300)
                throw new DomainException("Thong tin trinh duyet khong duoc vuot qua 300 ky tu.");
        }
    }
}
