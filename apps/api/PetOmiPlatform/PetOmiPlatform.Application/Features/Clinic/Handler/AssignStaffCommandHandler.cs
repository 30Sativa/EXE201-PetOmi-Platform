using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class AssignStaffCommandHandler : IRequestHandler<AssignStaffCommand>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IVetProfileRepository _vetProfileRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AssignStaffCommandHandler(
            IClinicRepository clinicRepository,
            IVetProfileRepository vetProfileRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _vetProfileRepository = vetProfileRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task Handle(AssignStaffCommand command, CancellationToken cancellationToken)
        {
            // 1. Kiểm tra clinic tồn tại
            var clinic = await _clinicRepository.GetByIdAsync(command.ClinicId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            // 2. Kiểm tra clinic đã được duyệt chưa
            clinic.EnsureApproved();

            // 3. Kiểm tra người gán có phải ClinicOwner không
            var isOwner = await _vetClinicRepository.IsClinicOwnerAsync(
                command.RequestingUserId, command.ClinicId);
            if (!isOwner)
                throw new ForbiddenException("Chỉ ClinicOwner mới được gán bác sĩ.");

            // 4. Kiểm tra VetProfile được gán tồn tại
            var vetProfile = await _vetProfileRepository.GetByIdAsync(command.Request.VetProfileId)
                ?? throw new NotFoundException("Không tìm thấy VetProfile.");

            // 5. Kiểm tra bác sĩ chưa thuộc clinic này
            var alreadyAssigned = await _vetClinicRepository.ExistsAsync(
                command.Request.VetProfileId, command.ClinicId);
            if (alreadyAssigned)
                throw new ConflictException("Bác sĩ này đã thuộc phòng khám.");

            // 6. Convert role string → Guid
            var roleId = ClinicRoleConstants.ToRoleId(command.Request.Role);

            // 7. Tạo VetClinic
            var vetClinic = new VetClinicDomain(
                vetProfileId: vetProfile.Id,
                clinicId: command.ClinicId,
                roleId: roleId
            );
            await _vetClinicRepository.AddAsync(vetClinic);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
