using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class CreateClinicCommandHandler : IRequestHandler<CreateClinicCommand, CreateClinicResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IVetProfileRepository _vetProfileRepository;
        private readonly IClinicRepository _clinicRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateClinicCommandHandler(
            IUserRepository userRepository,
            IVetProfileRepository vetProfileRepository,
            IClinicRepository clinicRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _vetProfileRepository = vetProfileRepository;
            _clinicRepository = clinicRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<CreateClinicResponse> Handle(CreateClinicCommand command, CancellationToken cancellationToken)
        {
            // 1. Ensure the current owner has a technical VetProfile for clinic membership.
            //    The user-facing registration flow only asks for the clinic profile.
            var vetProfile = await _vetProfileRepository.GetByUserIdAsync(command.UserId);
            if (vetProfile == null)
            {
                vetProfile = VetProfileDomain.Create(
                    userId: command.UserId,
                    licenseNumber: null,
                    specialization: null);
                await _vetProfileRepository.AddAsync(vetProfile);
            }

            var licenseNumber = string.IsNullOrWhiteSpace(command.Request.LicenseNumber)
                ? null
                : command.Request.LicenseNumber.Trim();

            // 2. Kiểm tra LicenseNumber chưa bị trùng nếu client cũ vẫn gửi mã giấy phép
            if (licenseNumber != null)
            {
                var exists = await _clinicRepository.ExistsByLicenseNumberAsync(licenseNumber);
                if (exists)
                    throw new ConflictException("Số giấy phép này đã được đăng ký.");
            }

            // 3. Tạo Clinic — Status mặc định "Pending"
            var clinic = ClinicDomain.Create(
                clinicName: command.Request.ClinicName,
                address: command.Request.Address,
                phone: command.Request.Phone,
                email: command.Request.Email,
                licenseNumber: licenseNumber,
                licenseImageUrl: command.Request.LicenseImageUrl,
                licenseCloudinaryPublicId: command.Request.LicenseCloudinaryPublicId,
                logoUrl: command.Request.LogoUrl,
                logoCloudinaryPublicId: command.Request.LogoCloudinaryPublicId
            );
            await _clinicRepository.AddAsync(clinic);

            // 4. Auto gán ClinicOwner cho người tạo
            //    VetClinic = hợp đồng giữa VetProfile và Clinic
            var vetClinic = new VetClinicDomain(
                vetProfileId: vetProfile.Id,
                clinicId: clinic.Id,
                roleId: ClinicRoleConstants.ClinicOwnerId
            );
            await _vetClinicRepository.AddAsync(vetClinic);

            // 5. SaveChanges 1 lần cho cả Clinic + VetClinic
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new CreateClinicResponse
            {
                ClinicId = clinic.Id,
                VetProfileId = vetProfile.Id,
                ClinicName = clinic.ClinicName,
                Address = clinic.Address,
                Phone = clinic.Phone,
                Email = clinic.Email,
                LicenseNumber = clinic.LicenseNumber,
                LicenseImageUrl = clinic.LicenseImageUrl,
                LicenseCloudinaryPublicId = clinic.LicenseCloudinaryPublicId,
                LogoUrl = clinic.LogoUrl,
                LogoCloudinaryPublicId = clinic.LogoCloudinaryPublicId,
                Status = clinic.Status.ToString()
            };
        }
    }
}
