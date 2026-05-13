using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class ApproveClinicCommandHandler : IRequestHandler<ApproveClinicCommand, ReviewClinicResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ApproveClinicCommandHandler(
            IClinicRepository clinicRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ReviewClinicResponse> Handle(ApproveClinicCommand command, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByIdAsync(command.ClinicId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            clinic.Approve(command.AdminId);

            await _clinicRepository.UpdateAsync(clinic);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new ReviewClinicResponse
            {
                ClinicId = clinic.Id,
                ClinicName = clinic.ClinicName,
                Status = clinic.Status.ToString(),
                RejectedReason = clinic.RejectedReason,
                ReviewedByAdminId = clinic.ReviewedByAdminId,
                UpdatedAt = clinic.UpdatedAt
            };
        }
    }
}
