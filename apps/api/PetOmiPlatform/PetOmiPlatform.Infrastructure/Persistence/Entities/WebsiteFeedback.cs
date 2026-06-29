namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class WebsiteFeedback
{
    public Guid WebsiteFeedbackId { get; set; }

    public Guid UserId { get; set; }

    public string Category { get; set; } = null!;

    public int? Rating { get; set; }

    public string Subject { get; set; } = null!;

    public string Message { get; set; } = null!;

    public string? PageUrl { get; set; }

    public string? BrowserInfo { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsActive { get; set; }

    public virtual User User { get; set; } = null!;
}
