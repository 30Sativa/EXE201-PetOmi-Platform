using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IWebsiteFeedbackRepository
    {
        Task AddAsync(WebsiteFeedbackDomain feedback);
        Task<(List<WebsiteFeedbackDomain> Items, int Total)> GetPagedAsync(
            string? search,
            string? category,
            string? status,
            int page,
            int pageSize);
    }
}
