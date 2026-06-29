namespace PetOmiPlatform.Application.Features.WebsiteFeedback.DTOs.Request
{
    public class CreateWebsiteFeedbackRequest
    {
        public string Category { get; set; } = "General";
        public int? Rating { get; set; }
        public string Subject { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string? PageUrl { get; set; }
        public string? BrowserInfo { get; set; }
    }
}
