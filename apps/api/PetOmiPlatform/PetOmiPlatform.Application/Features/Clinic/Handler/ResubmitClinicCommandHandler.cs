using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class ResubmitClinicCommandHandler : IRequestHandler<ResubmitClinicCommand, GetMyClinicResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IUnitOfWork _unitOfWork;

        public ResubmitClinicCommandHandler(
            IClinicRepository clinicRepository,
            ICloudinaryService cloudinaryService,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _cloudinaryService = cloudinaryService;
            _unitOfWork = unitOfWork;
        }

        public async Task<GetMyClinicResponse> Handle(ResubmitClinicCommand command, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByIdAsync(command.ClinicId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            var myClinic = await _clinicRepository.GetByOwnerUserIdAsync(command.UserId);
            if (myClinic == null || myClinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");

            string? oldLicensePublicId = null;
            bool hasNewLicense = command.Request.LicenseImageUrl != null
                && command.Request.LicenseImageUrl != clinic.LicenseImageUrl;

            if (hasNewLicense && !string.IsNullOrWhiteSpace(clinic.LicenseCloudinaryPublicId))
            {
                oldLicensePublicId = clinic.LicenseCloudinaryPublicId;
            }

            clinic.Resubmit(
                newLicenseNumber: command.Request.LicenseNumber,
                newLicenseImageUrl: command.Request.LicenseImageUrl,
                newLicenseCloudinaryPublicId: command.Request.LicenseCloudinaryPublicId
            );

            await _clinicRepository.UpdateAsync(clinic);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(oldLicensePublicId))
            {
                await _cloudinaryService.DeleteAsync(oldLicensePublicId, cancellationToken);
            }

            return new GetMyClinicResponse
            {
                ClinicId = clinic.Id,
                ClinicName = clinic.ClinicName,
                Address = clinic.Address,
                Phone = clinic.Phone,
                Email = clinic.Email,
                LicenseNumber = clinic.LicenseNumber,
                LicenseImageUrl = clinic.LicenseImageUrl,
                LicenseCloudinaryPublicId = clinic.LicenseCloudinaryPublicId,
                LogoUrl = clinic.LogoUrl,
                Status = clinic.Status.ToString(),
                RejectedReason = clinic.RejectedReason,
                CreatedAt = clinic.CreatedAt,
                UpdatedAt = clinic.UpdatedAt
            };
        }
    }
}
