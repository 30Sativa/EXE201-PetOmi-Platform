using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class RejectClinicCommandHandler : IRequestHandler<RejectClinicCommand, ReviewClinicResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RejectClinicCommandHandler(
            IClinicRepository clinicRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ReviewClinicResponse> Handle(RejectClinicCommand command, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByIdAsync(command.ClinicId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            clinic.Reject(command.AdminId, command.Request.Reason);

            await _clinicRepository.UpdateAsync(clinic);
            await _vetClinicRepository.DeactivateByClinicIdAsync(clinic.Id);
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
