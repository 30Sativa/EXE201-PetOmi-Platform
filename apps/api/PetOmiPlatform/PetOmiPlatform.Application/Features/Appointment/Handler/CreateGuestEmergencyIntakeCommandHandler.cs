using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Appointment.Mappers;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;
using PetOmiPlatform.Domain.ValueObjects;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class CreateGuestEmergencyIntakeCommandHandler
        : IRequestHandler<CreateGuestEmergencyIntakeCommand, GuestWalkInIntakeResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserRoleRepository _userRoleRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IPetRepository _petRepository;
        private readonly IClinicServiceRepository _serviceRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IPetCodeGenerator _petCodeGenerator;
        private readonly IUnitOfWork _unitOfWork;

        public CreateGuestEmergencyIntakeCommandHandler(
            IClinicRepository clinicRepository,
            IVetClinicRepository vetClinicRepository,
            IUserRepository userRepository,
            IUserRoleRepository userRoleRepository,
            IUserProfileRepository userProfileRepository,
            IPetRepository petRepository,
            IClinicServiceRepository serviceRepository,
            IAppointmentRepository appointmentRepository,
            IPasswordHasher passwordHasher,
            IPetCodeGenerator petCodeGenerator,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _vetClinicRepository = vetClinicRepository;
            _userRepository = userRepository;
            _userRoleRepository = userRoleRepository;
            _userProfileRepository = userProfileRepository;
            _petRepository = petRepository;
            _serviceRepository = serviceRepository;
            _appointmentRepository = appointmentRepository;
            _passwordHasher = passwordHasher;
            _petCodeGenerator = petCodeGenerator;
            _unitOfWork = unitOfWork;
        }

        public async Task<GuestWalkInIntakeResponse> Handle(
            CreateGuestEmergencyIntakeCommand command,
            CancellationToken cancellationToken)
        {
            var req = command.Request;

            var clinic = await _clinicRepository.GetByIdAsync(req.ClinicId)
                ?? throw new NotFoundException("Clinic", req.ClinicId);
            clinic.EnsureApproved();

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(command.StaffUserId, req.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            if (req.ServiceId.HasValue)
            {
                var service = await _serviceRepository.GetByIdAsync(req.ServiceId.Value)
                    ?? throw new NotFoundException("ClinicService", req.ServiceId.Value);
                if (service.ClinicId != req.ClinicId || !service.IsActive)
                    throw new ValidationException("ServiceId", "Dịch vụ không thuộc phòng khám hoặc đã ngừng hoạt động.");
            }

            if (req.VetClinicId.HasValue)
            {
                var vetClinic = await _vetClinicRepository.GetActiveByVetClinicIdAndClinicIdAsync(
                    req.VetClinicId.Value,
                    req.ClinicId);
                if (vetClinic == null)
                    throw new ValidationException("VetClinicId", "VetClinicId không thuộc phòng khám hoặc đã ngừng hoạt động.");
            }

            var tempEmail = BuildTemporaryGuestEmail(req.ClinicId, req.OwnerPhone);
            var tempPasswordRaw = $"Emergency#{Guid.NewGuid():N}!";
            var passwordHash = _passwordHasher.Hash(tempPasswordRaw);

            var ownerUser = UserDomain.Create(new Email(tempEmail), new PasswordHash(passwordHash));
            await _userRepository.AddAsync(ownerUser);
            await _userRoleRepository.AddIfNotExistsAsync(ownerUser.Id, RoleConstants.OwnerId);

            var ownerProfile = UserProfileDomain.Create(
                userId: ownerUser.Id,
                fullName: req.OwnerFullName,
                phone: req.OwnerPhone,
                avatarUrl: null,
                avatarCloudinaryPublicId: null,
                dateOfBirth: null,
                gender: null,
                address: req.OwnerAddress);
            await _userProfileRepository.AddAsync(ownerProfile);

            var pet = PetDomain.Create(
                ownerUserId: ownerUser.Id,
                publicPetCode: await GenerateUniquePublicPetCodeAsync(),
                name: req.PetName,
                species: req.PetSpecies,
                breed: req.PetBreed,
                gender: req.PetGender,
                dateOfBirth: req.PetDateOfBirth,
                isBirthDateEstimated: req.IsPetBirthDateEstimated,
                avatarUrl: null,
                avatarCloudinaryPublicId: null);
            await _petRepository.AddAsync(pet);

            var appointment = AppointmentDomain.CreateEmergency(
                clinicId: req.ClinicId,
                petId: pet.Id,
                staffUserId: command.StaffUserId,
                appointmentDate: req.AppointmentDate,
                startTime: req.StartTime,
                endTime: req.EndTime,
            vetClinicId: req.VetClinicId,
            serviceId: req.ServiceId,
            notes: req.Notes);

            appointment.CheckIn(command.StaffUserId);

            await _appointmentRepository.AddAsync(appointment);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new GuestWalkInIntakeResponse
            {
                TemporaryOwnerUserId = ownerUser.Id,
                TemporaryOwnerEmail = tempEmail,
                PetId = pet.Id,
                AppointmentId = appointment.Id,
                Appointment = appointment.ToResponse()
            };
        }

        private static string BuildTemporaryGuestEmail(Guid clinicId, string ownerPhone)
        {
            var phoneDigits = new string(ownerPhone.Where(char.IsDigit).ToArray());
            if (string.IsNullOrWhiteSpace(phoneDigits))
            {
                phoneDigits = "nop";
            }

            var shortPhone = phoneDigits.Length > 6 ? phoneDigits[^6..] : phoneDigits;
            var clinicPart = clinicId.ToString("N")[..8];
            var randomPart = Guid.NewGuid().ToString("N")[..6];
            return $"emergency+{clinicPart}.{shortPhone}.{DateTime.UtcNow:yyyyMMddHHmmss}.{randomPart}@guest.petomi.local";
        }

        private async Task<string> GenerateUniquePublicPetCodeAsync()
        {
            for (var attempt = 0; attempt < 10; attempt++)
            {
                var code = _petCodeGenerator.GeneratePublicPetCode();
                if (!await _petRepository.PublicPetCodeExistsAsync(code))
                    return code;
            }

            throw new ConflictException("Không thể tạo mã định danh thú cưng. Vui lòng thử lại.");
        }
    }
}
