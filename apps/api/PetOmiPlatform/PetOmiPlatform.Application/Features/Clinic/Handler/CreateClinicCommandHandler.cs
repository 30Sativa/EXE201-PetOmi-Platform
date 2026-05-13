using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
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
            var user = await _userRepository.GetByIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy tài khoản.");

            var vetProfile = await _vetProfileRepository.GetByUserIdAsync(user.Id)
                ?? throw new ConflictException("Tài khoản cần tạo VetProfile trước khi tạo phòng khám.");

            if (!string.IsNullOrWhiteSpace(command.Request.LicenseNumber))
            {
                var exists = await _clinicRepository.ExistsByLicenseNumberAsync(command.Request.LicenseNumber);
                if (exists)
                    throw new ConflictException("Số giấy phép phòng khám đã tồn tại.");
            }

            var clinic = ClinicDomain.Create(
                clinicName: command.Request.ClinicName,
                address: command.Request.Address,
                phone: command.Request.Phone,
                email: command.Request.Email,
                licenseNumber: command.Request.LicenseNumber
            );

            await _clinicRepository.AddAsync(clinic);
            await _vetClinicRepository.AddClinicOwnerAsync(vetProfile.Id, clinic.Id);
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
                Status = clinic.Status.ToString()
            };
        }
    }
}
