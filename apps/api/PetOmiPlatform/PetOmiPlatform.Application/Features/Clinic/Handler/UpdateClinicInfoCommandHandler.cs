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
    public class UpdateClinicInfoCommandHandler : IRequestHandler<UpdateClinicInfoCommand, GetMyClinicResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateClinicInfoCommandHandler(
            IClinicRepository clinicRepository,
            ICloudinaryService cloudinaryService,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _cloudinaryService = cloudinaryService;
            _unitOfWork = unitOfWork;
        }

        public async Task<GetMyClinicResponse> Handle(UpdateClinicInfoCommand command, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            if (clinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền chỉnh sửa phòng khám này.");

            string? oldLogoPublicId = null;
            bool hasNewLogo = command.Request.LogoUrl != null
                && command.Request.LogoUrl != clinic.LogoUrl;

            if (hasNewLogo && !string.IsNullOrWhiteSpace(clinic.LogoCloudinaryPublicId))
            {
                oldLogoPublicId = clinic.LogoCloudinaryPublicId;
            }

            clinic.UpdateInfo(
                clinicName: command.Request.ClinicName,
                address: command.Request.Address,
                phone: command.Request.Phone,
                email: command.Request.Email,
                logoUrl: command.Request.LogoUrl,
                logoCloudinaryPublicId: command.Request.LogoCloudinaryPublicId,
                description: command.Request.Description,
                openingHours: command.Request.OpeningHours
            );

            await _clinicRepository.UpdateAsync(clinic);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(oldLogoPublicId))
            {
                await _cloudinaryService.DeleteAsync(oldLogoPublicId, cancellationToken);
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
                LogoUrl = clinic.LogoUrl,
                Status = clinic.Status.ToString(),
                RejectedReason = clinic.RejectedReason,
                CreatedAt = clinic.CreatedAt,
                UpdatedAt = clinic.UpdatedAt
            };
        }
    }
}
