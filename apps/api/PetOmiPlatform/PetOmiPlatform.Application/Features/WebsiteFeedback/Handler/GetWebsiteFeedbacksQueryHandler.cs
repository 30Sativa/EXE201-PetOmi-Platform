using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.WebsiteFeedback.DTOs.Response;
using PetOmiPlatform.Application.Features.WebsiteFeedback.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.WebsiteFeedback.Handler
{
    public class GetWebsiteFeedbacksQueryHandler
        : IRequestHandler<GetWebsiteFeedbacksQuery, PagedData<WebsiteFeedbackResponse>>
    {
        private readonly IWebsiteFeedbackRepository _feedbackRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserProfileRepository _userProfileRepository;

        public GetWebsiteFeedbacksQueryHandler(
            IWebsiteFeedbackRepository feedbackRepository,
            IUserRepository userRepository,
            IUserProfileRepository userProfileRepository)
        {
            _feedbackRepository = feedbackRepository;
            _userRepository = userRepository;
            _userProfileRepository = userProfileRepository;
        }

        public async Task<PagedData<WebsiteFeedbackResponse>> Handle(
            GetWebsiteFeedbacksQuery query,
            CancellationToken cancellationToken)
        {
            var (feedbacks, total) = await _feedbackRepository.GetPagedAsync(
                query.Search,
                query.Category,
                query.Status,
                query.Page,
                query.PageSize);

            var items = new List<WebsiteFeedbackResponse>();

            foreach (var feedback in feedbacks)
            {
                var user = await _userRepository.GetByIdAsync(feedback.UserId);
                var profile = await _userProfileRepository.GetByUserIdAsync(feedback.UserId);

                items.Add(new WebsiteFeedbackResponse
                {
                    FeedbackId = feedback.Id,
                    UserId = feedback.UserId,
                    UserEmail = user?.Email.Value,
                    UserFullName = profile?.FullName,
                    Category = feedback.Category,
                    Rating = feedback.Rating,
                    Subject = feedback.Subject,
                    Message = feedback.Message,
                    PageUrl = feedback.PageUrl,
                    BrowserInfo = feedback.BrowserInfo,
                    Status = feedback.Status,
                    CreatedAt = feedback.CreatedAt
                });
            }

            return new PagedData<WebsiteFeedbackResponse>
            {
                Items = items,
                Meta = new PaginationMeta<WebsiteFeedbackResponse>
                {
                    PageNumber = query.Page,
                    PageSize = query.PageSize,
                    TotalRecords = total
                }
            };
        }
    }
}
