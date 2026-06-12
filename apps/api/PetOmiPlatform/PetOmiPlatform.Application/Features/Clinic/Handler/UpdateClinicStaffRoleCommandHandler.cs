using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class UpdateClinicStaffRoleCommandHandler : IRequestHandler<UpdateClinicStaffRoleCommand, bool>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateClinicStaffRoleCommandHandler(
            IClinicRepository clinicRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(UpdateClinicStaffRoleCommand request, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByIdAsync(request.ClinicId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");
            clinic.EnsureApproved();

            var isOwner = await _vetClinicRepository.IsClinicOwnerAsync(request.RequestingUserId, request.ClinicId);
            if (!isOwner)
                throw new ForbiddenException("Chỉ ClinicOwner mới được cập nhật vai trò nhân viên.");

            var staff = await _vetClinicRepository.GetActiveByVetClinicIdAndClinicIdAsync(
                request.VetClinicId,
                request.ClinicId) ?? throw new NotFoundException("Không tìm thấy nhân viên đang hoạt động trong phòng khám.");

            if (staff.RoleId == ClinicRoleConstants.ClinicOwnerId)
                throw new ForbiddenException("Không thể đổi vai trò của ClinicOwner.");

            var roleId = ClinicRoleConstants.ToRoleId(request.Request.Role);
            staff.ChangeRole(roleId, DateTime.UtcNow);

            await _vetClinicRepository.UpdateAsync(staff);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
