using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class DeactivateClinicStaffCommandHandler : IRequestHandler<DeactivateClinicStaffCommand, bool>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeactivateClinicStaffCommandHandler(
            IClinicRepository clinicRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(DeactivateClinicStaffCommand request, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByIdAsync(request.ClinicId)
                ?? throw new NotFoundException("Khong tim thay phong kham.");
            clinic.EnsureApproved();

            var isOwner = await _vetClinicRepository.IsClinicOwnerAsync(request.RequestingUserId, request.ClinicId);
            if (!isOwner)
                throw new ForbiddenException("Chi ClinicOwner moi duoc ngung hoat dong staff.");

            var staff = await _vetClinicRepository.GetActiveByVetClinicIdAndClinicIdAsync(
                request.VetClinicId,
                request.ClinicId) ?? throw new NotFoundException("Khong tim thay staff dang hoat dong trong phong kham.");

            staff.Deactivate(DateTime.UtcNow);

            await _vetClinicRepository.UpdateAsync(staff);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
