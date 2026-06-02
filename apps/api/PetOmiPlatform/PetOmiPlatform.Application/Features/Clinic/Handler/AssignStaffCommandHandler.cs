using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class AssignStaffCommandHandler : IRequestHandler<AssignStaffCommand>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IVetProfileRepository _vetProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AssignStaffCommandHandler(
            IClinicRepository clinicRepository,
            IVetProfileRepository vetProfileRepository,
            IUserRepository userRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _vetProfileRepository = vetProfileRepository;
            _userRepository = userRepository;
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

            // 4. Resolve staff theo VetEmail (ưu tiên) hoặc VetProfileId (backward-compatible)
            var vetProfile = await ResolveVetProfileAsync(command);

            // 5. Kiểm tra bác sĩ chưa thuộc clinic này
            var alreadyAssigned = await _vetClinicRepository.ExistsAsync(
                vetProfile.Id, command.ClinicId);
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

        private async Task<VetProfileDomain> ResolveVetProfileAsync(AssignStaffCommand command)
        {
            if (!string.IsNullOrWhiteSpace(command.Request.VetEmail))
            {
                var email = new Email(command.Request.VetEmail);
                var user = await _userRepository.GetByNormalizedEmail(email.NormalizedValue)
                    ?? throw new NotFoundException($"Không tìm thấy user với email '{email.Value}'.");

                var vetProfileByEmail = await _vetProfileRepository.GetByUserIdAsync(user.Id);
                if (vetProfileByEmail == null)
                {
                    throw new ConflictException($"Tài khoản '{email.Value}' chưa có hồ sơ bác sĩ (VetProfile).");
                }

                return vetProfileByEmail;
            }

            if (command.Request.VetProfileId.HasValue)
            {
                var vetProfileById = await _vetProfileRepository.GetByIdAsync(command.Request.VetProfileId.Value);
                if (vetProfileById == null)
                {
                    throw new NotFoundException("Không tìm thấy VetProfile.");
                }

                return vetProfileById;
            }

            throw new ConflictException("Cần cung cấp VetEmail hoặc VetProfileId để gán staff.");
        }
    }
}
