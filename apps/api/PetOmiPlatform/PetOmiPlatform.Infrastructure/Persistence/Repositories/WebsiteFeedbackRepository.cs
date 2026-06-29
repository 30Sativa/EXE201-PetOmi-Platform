using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class WebsiteFeedbackRepository : IWebsiteFeedbackRepository
    {
        private readonly PetOmniDbContext _context;

        public WebsiteFeedbackRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(WebsiteFeedbackDomain feedback)
        {
            await _context.WebsiteFeedbacks.AddAsync(feedback.ToEntity());
        }

        public async Task<(List<WebsiteFeedbackDomain> Items, int Total)> GetPagedAsync(
            string? search,
            string? category,
            string? status,
            int page,
            int pageSize)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.WebsiteFeedbacks
                .AsNoTracking()
                .Where(feedback => feedback.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var keyword = search.Trim();
                query = query.Where(feedback =>
                    feedback.Subject.Contains(keyword) ||
                    feedback.Message.Contains(keyword));
            }

            if (!string.IsNullOrWhiteSpace(category))
            {
                var normalizedCategory = category.Trim();
                query = query.Where(feedback => feedback.Category == normalizedCategory);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim();
                query = query.Where(feedback => feedback.Status == normalizedStatus);
            }

            var total = await query.CountAsync();
            var entities = await query
                .OrderByDescending(feedback => feedback.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (entities.Select(entity => entity.ToDomain()).ToList(), total);
        }
    }
}
