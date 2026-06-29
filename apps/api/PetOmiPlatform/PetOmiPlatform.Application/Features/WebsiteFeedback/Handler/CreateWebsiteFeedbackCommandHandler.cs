using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.WebsiteFeedback.Command;
using PetOmiPlatform.Application.Features.WebsiteFeedback.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.WebsiteFeedback.Handler
{
    public class CreateWebsiteFeedbackCommandHandler
        : IRequestHandler<CreateWebsiteFeedbackCommand, WebsiteFeedbackResponse>
    {
        private readonly IWebsiteFeedbackRepository _feedbackRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateWebsiteFeedbackCommandHandler(
            IWebsiteFeedbackRepository feedbackRepository,
            IUserRoleRepository userRoleRepository,
            IUnitOfWork unitOfWork)
        {
            _feedbackRepository = feedbackRepository;
            _userRoleRepository = userRoleRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<WebsiteFeedbackResponse> Handle(
            CreateWebsiteFeedbackCommand command,
            CancellationToken cancellationToken)
        {
            var roles = await _userRoleRepository.GetRolesByUserIdAsync(command.UserId);
            if (roles.Any(role => string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)))
            {
                throw new ForbiddenException("Admin khong the gui feedback website.");
            }

            var request = command.Request;
            var feedback = WebsiteFeedbackDomain.Create(
                userId: command.UserId,
                category: request.Category,
                rating: request.Rating,
                subject: request.Subject,
                message: request.Message,
                pageUrl: request.PageUrl,
                browserInfo: request.BrowserInfo);

            await _feedbackRepository.AddAsync(feedback);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new WebsiteFeedbackResponse
            {
                FeedbackId = feedback.Id,
                UserId = feedback.UserId,
                Category = feedback.Category,
                Rating = feedback.Rating,
                Subject = feedback.Subject,
                Message = feedback.Message,
                PageUrl = feedback.PageUrl,
                BrowserInfo = feedback.BrowserInfo,
                Status = feedback.Status,
                CreatedAt = feedback.CreatedAt
            };
        }
    }
}
