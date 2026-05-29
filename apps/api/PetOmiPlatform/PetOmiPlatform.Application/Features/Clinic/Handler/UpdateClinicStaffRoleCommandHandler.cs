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
                ?? throw new NotFoundException("Khong tim thay phong kham.");
            clinic.EnsureApproved();

            var isOwner = await _vetClinicRepository.IsClinicOwnerAsync(request.RequestingUserId, request.ClinicId);
            if (!isOwner)
                throw new ForbiddenException("Chi ClinicOwner moi duoc cap nhat vai tro staff.");

            var staff = await _vetClinicRepository.GetActiveByVetClinicIdAndClinicIdAsync(
                request.VetClinicId,
                request.ClinicId) ?? throw new NotFoundException("Khong tim thay staff dang hoat dong trong phong kham.");

            if (staff.RoleId == ClinicRoleConstants.ClinicOwnerId)
                throw new ForbiddenException("Khong the doi role cua ClinicOwner.");

            var roleId = ClinicRoleConstants.ToRoleId(request.Request.Role);
            staff.ChangeRole(roleId, DateTime.UtcNow);

            await _vetClinicRepository.UpdateAsync(staff);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
