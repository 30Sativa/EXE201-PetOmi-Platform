using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Appointment.Mappers;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;
using PetOmiPlatform.Domain.ValueObjects;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class CreateGuestWalkInIntakeCommandHandler
        : IRequestHandler<CreateGuestWalkInIntakeCommand, GuestWalkInIntakeResponse>
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
        private readonly IUnitOfWork _unitOfWork;

        public CreateGuestWalkInIntakeCommandHandler(
            IClinicRepository clinicRepository,
            IVetClinicRepository vetClinicRepository,
            IUserRepository userRepository,
            IUserRoleRepository userRoleRepository,
            IUserProfileRepository userProfileRepository,
            IPetRepository petRepository,
            IClinicServiceRepository serviceRepository,
            IAppointmentRepository appointmentRepository,
            IPasswordHasher passwordHasher,
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
            _unitOfWork = unitOfWork;
        }

        public async Task<GuestWalkInIntakeResponse> Handle(
            CreateGuestWalkInIntakeCommand command,
            CancellationToken cancellationToken)
        {
            var req = command.Request;

            var clinic = await _clinicRepository.GetByIdAsync(req.ClinicId)
                ?? throw new NotFoundException("Clinic", req.ClinicId);
            clinic.EnsureApproved();

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(command.StaffUserId, req.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            if (!Enum.TryParse<AppointmentType>(req.AppointmentType, true, out var appointmentType))
                throw new ValidationException("AppointmentType", $"Loai lich hen khong hop le: {req.AppointmentType}");

            if (req.ServiceId.HasValue)
            {
                var service = await _serviceRepository.GetByIdAsync(req.ServiceId.Value)
                    ?? throw new NotFoundException("ClinicService", req.ServiceId.Value);
                if (service.ClinicId != req.ClinicId || !service.IsActive)
                    throw new ValidationException("ServiceId", "Dich vu khong thuoc clinic hoac da ngung hoat dong.");
            }

            if (req.VetClinicId.HasValue)
            {
                var vetClinic = await _vetClinicRepository.GetActiveByVetClinicIdAndClinicIdAsync(
                    req.VetClinicId.Value,
                    req.ClinicId);
                if (vetClinic == null)
                    throw new ValidationException("VetClinicId", "VetClinicId khong thuoc clinic hoac da ngung hoat dong.");

                var allVetClinicIds = await _vetClinicRepository.GetAllVetClinicIdsAsync(vetClinic.VetProfileId);
                var hasConflict = await _appointmentRepository.HasDoctorConflictAcrossClinicsAsync(
                    allVetClinicIds,
                    req.AppointmentDate,
                    req.StartTime,
                    req.EndTime);
                if (hasConflict)
                    throw new ConflictException("Bac si da co lich trong khung gio nay.");
            }

            var tempEmail = BuildTemporaryGuestEmail(req.ClinicId, req.OwnerPhone);
            var tempPasswordRaw = $"Guest#{Guid.NewGuid():N}!";
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
                name: req.PetName,
                species: req.PetSpecies,
                breed: req.PetBreed,
                gender: req.PetGender,
                dateOfBirth: req.PetDateOfBirth,
                isBirthDateEstimated: req.IsPetBirthDateEstimated,
                avatarUrl: null,
                avatarCloudinaryPublicId: null);
            await _petRepository.AddAsync(pet);

            var appointment = AppointmentDomain.CreateWalkIn(
                clinicId: req.ClinicId,
                petId: pet.Id,
                staffUserId: command.StaffUserId,
                appointmentDate: req.AppointmentDate,
                startTime: req.StartTime,
                endTime: req.EndTime,
                appointmentType: appointmentType,
                vetClinicId: req.VetClinicId,
                serviceId: req.ServiceId,
                notes: req.Notes);
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
            return $"guest+{clinicPart}.{shortPhone}.{DateTime.UtcNow:yyyyMMddHHmmss}.{randomPart}@guest.petomi.local";
        }
    }
}
