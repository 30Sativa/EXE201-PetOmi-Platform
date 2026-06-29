namespace PetOmiPlatform.Application.Features.WebsiteFeedback.DTOs.Response
{
    public class WebsiteFeedbackResponse
    {
        public Guid FeedbackId { get; set; }
        public Guid UserId { get; set; }
        public string? UserEmail { get; set; }
        public string? UserFullName { get; set; }
        public string Category { get; set; } = null!;
        public int? Rating { get; set; }
        public string Subject { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string? PageUrl { get; set; }
        public string? BrowserInfo { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}
