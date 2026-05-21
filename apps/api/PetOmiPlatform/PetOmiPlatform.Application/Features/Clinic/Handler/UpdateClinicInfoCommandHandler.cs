using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class UpdateClinicInfoCommandHandler : IRequestHandler<UpdateClinicInfoCommand, GetMyClinicResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateClinicInfoCommandHandler(IClinicRepository clinicRepository, IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<GetMyClinicResponse> Handle(UpdateClinicInfoCommand command, CancellationToken cancellationToken)
        {
            // 1. Lấy clinic của chính user này
            var clinic = await _clinicRepository.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            // Kiểm tra đúng clinic được yêu cầu
            if (clinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền chỉnh sửa phòng khám này.");

            // 2. Domain behavior — chỉ Approved mới được edit (EnsureApproved bên trong)
            clinic.UpdateInfo(
                clinicName: command.Request.ClinicName,
                address: command.Request.Address,
                phone: command.Request.Phone,
                email: command.Request.Email,
                logoUrl: command.Request.LogoUrl,
                description: command.Request.Description,
                openingHours: command.Request.OpeningHours
            );

            // 3. Persist
            await _clinicRepository.UpdateAsync(clinic);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new GetMyClinicResponse
            {
                ClinicId = clinic.Id,
                ClinicName = clinic.ClinicName,
                Address = clinic.Address,
                Phone = clinic.Phone,
                Email = clinic.Email,
                LicenseNumber = clinic.LicenseNumber,
                LicenseImageUrl = clinic.LicenseImageUrl,
                Status = clinic.Status.ToString(),
                RejectedReason = clinic.RejectedReason,
                CreatedAt = clinic.CreatedAt,
                UpdatedAt = clinic.UpdatedAt
            };
        }
    }
}
