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
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");
            clinic.EnsureApproved();

            var isOwner = await _vetClinicRepository.IsClinicOwnerAsync(request.RequestingUserId, request.ClinicId);
            if (!isOwner)
                throw new ForbiddenException("Chỉ ClinicOwner mới được ngừng hoạt động nhân viên.");

            var staff = await _vetClinicRepository.GetActiveByVetClinicIdAndClinicIdAsync(
                request.VetClinicId,
                request.ClinicId) ?? throw new NotFoundException("Không tìm thấy nhân viên đang hoạt động trong phòng khám.");

            staff.Deactivate(DateTime.UtcNow);

            await _vetClinicRepository.UpdateAsync(staff);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
