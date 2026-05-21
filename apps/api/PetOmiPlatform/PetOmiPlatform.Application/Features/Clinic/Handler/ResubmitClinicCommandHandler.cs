using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class ResubmitClinicCommandHandler : IRequestHandler<ResubmitClinicCommand, GetMyClinicResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ResubmitClinicCommandHandler(IClinicRepository clinicRepository, IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<GetMyClinicResponse> Handle(ResubmitClinicCommand command, CancellationToken cancellationToken)
        {
            // 1. Lấy clinic theo ClinicId
            var clinic = await _clinicRepository.GetByIdAsync(command.ClinicId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            // 2. Kiểm tra user là ClinicOwner của clinic này
            //    Đơn giản: lấy clinic theo owner userId và so sánh id
            var myClinic = await _clinicRepository.GetByOwnerUserIdAsync(command.UserId);
            if (myClinic == null || myClinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");

            // 3. Domain behavior — validate + reset về Pending
            clinic.Resubmit(
                newLicenseNumber: command.Request.LicenseNumber,
                newLicenseImageUrl: command.Request.LicenseImageUrl
            );

            // 4. Persist
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
