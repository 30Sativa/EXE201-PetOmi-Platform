using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.ClinicReview.Command;
using PetOmiPlatform.Application.Features.ClinicReview.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.ClinicReview.Handler
{
    public class CreateClinicReviewCommandHandler
        : IRequestHandler<CreateClinicReviewCommand, ClinicReviewResponse>
    {
        private readonly IClinicReviewRepository _reviewRepository;
        private readonly IClinicRepository _clinicRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateClinicReviewCommandHandler(
            IClinicReviewRepository reviewRepository,
            IClinicRepository clinicRepository,
            IAppointmentRepository appointmentRepository,
            IUnitOfWork unitOfWork)
        {
            _reviewRepository = reviewRepository;
            _clinicRepository = clinicRepository;
            _appointmentRepository = appointmentRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ClinicReviewResponse> Handle(
            CreateClinicReviewCommand command, CancellationToken cancellationToken)
        {
            var request = command.Request;

            _ = await _clinicRepository.GetByIdAsync(request.ClinicId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            if (request.AppointmentId.HasValue)
            {
                var appointment = await _appointmentRepository.GetByIdAsync(request.AppointmentId.Value)
                    ?? throw new NotFoundException("Không tìm thấy lịch hẹn.");

                if (appointment.BookedByUserId != command.OwnerUserId)
                    throw new ForbiddenException("Bạn không thể đánh giá lịch hẹn của người khác.");

                if (appointment.ClinicId != request.ClinicId)
                    throw new BadRequestException("Lịch hẹn không thuộc phòng khám này.");

                if (appointment.Status != AppointmentStatus.Completed)
                    throw new ConflictException("Chỉ có thể đánh giá sau khi lịch hẹn đã hoàn thành.");
            }

            var alreadyReviewed = await _reviewRepository.HasReviewedAsync(
                request.ClinicId, command.OwnerUserId);
            if (alreadyReviewed)
                throw new ConflictException("Bạn đã đánh giá phòng khám này rồi.");

            var review = ClinicReviewDomain.Create(
                clinicId: request.ClinicId,
                ownerUserId: command.OwnerUserId,
                rating: request.Rating,
                reviewContent: request.ReviewContent,
                appointmentId: request.AppointmentId);

            await _reviewRepository.AddAsync(review);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new ClinicReviewResponse
            {
                ReviewId = review.Id,
                ClinicId = review.ClinicId,
                OwnerUserId = review.OwnerUserId,
                AppointmentId = review.AppointmentId,
                Rating = review.Rating,
                ReviewContent = review.ReviewContent,
                Status = review.Status,
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt
            };
        }
    }
}
