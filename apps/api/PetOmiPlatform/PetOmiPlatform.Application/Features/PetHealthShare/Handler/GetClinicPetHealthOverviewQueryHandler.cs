using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;
using PetOmiPlatform.Application.Features.PetHealthShare.Query;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Handler
{
    public class GetClinicPetHealthOverviewQueryHandler
        : IRequestHandler<GetClinicPetHealthOverviewQuery, PetHealthOverviewResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IPetRepository _petRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly IPetHealthProfileRepository _healthProfileRepository;
        private readonly IPetMedicalRecordRepository _medicalRecordRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IPetHealthShareTokenRepository _shareTokenRepository;

        public GetClinicPetHealthOverviewQueryHandler(
            IClinicRepository clinicRepository,
            IVetClinicRepository vetClinicRepository,
            IPetRepository petRepository,
            IUserRepository userRepository,
            IUserProfileRepository userProfileRepository,
            IPetHealthProfileRepository healthProfileRepository,
            IPetMedicalRecordRepository medicalRecordRepository,
            IAppointmentRepository appointmentRepository,
            IMedicalExaminationRepository examinationRepository,
            IPrescriptionRepository prescriptionRepository,
            IPetHealthShareTokenRepository shareTokenRepository)
        {
            _clinicRepository = clinicRepository;
            _vetClinicRepository = vetClinicRepository;
            _petRepository = petRepository;
            _userRepository = userRepository;
            _userProfileRepository = userProfileRepository;
            _healthProfileRepository = healthProfileRepository;
            _medicalRecordRepository = medicalRecordRepository;
            _appointmentRepository = appointmentRepository;
            _examinationRepository = examinationRepository;
            _prescriptionRepository = prescriptionRepository;
            _shareTokenRepository = shareTokenRepository;
        }

        public async Task<PetHealthOverviewResponse> Handle(
            GetClinicPetHealthOverviewQuery query,
            CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByIdAsync(query.ClinicId)
                ?? throw new NotFoundException("Clinic", query.ClinicId);
            clinic.EnsureApproved();

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(
                query.RequestUserId,
                query.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Khong tim thay ho so thu cung.");
            pet.EnsureActive();

            var appointments = (await _appointmentRepository.GetByPetIdAsync(query.PetId, 1, 1000)).ToList();
            var access = await ResolveAccessAsync(query, appointments);

            var healthProfile = await _healthProfileRepository.GetByPetIdAsync(query.PetId);
            var medicalRecords = await _medicalRecordRepository.GetByPetIdAsync(query.PetId);
            var examinations = (await _examinationRepository.GetByPetIdAsync(query.PetId, 1, 100)).ToList();
            var prescriptions = await LoadPrescriptionsAsync(examinations);
            var owner = await BuildOwnerAsync(pet.OwnerUserId, access.Scope);

            return new PetHealthOverviewResponse
            {
                Pet = MapPet(pet),
                Owner = owner,
                HealthProfile = healthProfile == null ? null : MapHealthProfile(healthProfile),
                Alerts = BuildAlerts(healthProfile, medicalRecords),
                MedicalRecords = MapMedicalRecords(medicalRecords, access.Scope),
                Examinations = MapExaminations(examinations, access.Scope),
                Prescriptions = MapPrescriptions(prescriptions, access.Scope),
                Appointments = MapAppointments(appointments, access.Scope, query.ClinicId, access.Source),
                Access = access
            };
        }

        private async Task<PetHealthOverviewAccessResponse> ResolveAccessAsync(
            GetClinicPetHealthOverviewQuery query,
            List<AppointmentDomain> appointments)
        {
            if (!string.IsNullOrWhiteSpace(query.ShareCode))
            {
                var shareToken = await _shareTokenRepository.GetByDisplayCodeAsync(
                    query.ShareCode.Trim().ToUpperInvariant());

                if (shareToken == null)
                    throw new NotFoundException("Ma chia se ho so suc khoe khong ton tai hoac da bi thu hoi.");

                if (shareToken.PetId != query.PetId)
                    throw new ForbiddenException("Ma chia se khong thuoc ho so thu cung nay.");

                if (!shareToken.CanBeUsedByClinic(query.ClinicId, DateTime.UtcNow) &&
                    !IsPreviouslyResolvedForClinic(shareToken, query.ClinicId, DateTime.UtcNow))
                {
                    throw new ForbiddenException("Ma chia se ho so suc khoe khong hop le cho phong kham nay.");
                }

                return new PetHealthOverviewAccessResponse
                {
                    Source = "HealthShareCode",
                    Scope = shareToken.Scope.ToString(),
                    ExpiresAt = shareToken.ExpiresAt
                };
            }

            var hasClinicRelationship = appointments.Any(a => a.ClinicId == query.ClinicId);
            if (!hasClinicRelationship)
                throw new ForbiddenException("Ho so suc khoe yeu cau HealthShareCode hoac lich hen hop le voi phong kham.");

            return new PetHealthOverviewAccessResponse
            {
                Source = "ClinicRelationship",
                Scope = PetHealthShareScope.ClinicVisit.ToString(),
                ExpiresAt = null
            };
        }

        private static bool IsPreviouslyResolvedForClinic(
            PetHealthShareTokenDomain shareToken,
            Guid clinicId,
            DateTime nowUtc)
        {
            return shareToken.LastUsedAt.HasValue
                && !shareToken.IsRevoked()
                && !shareToken.IsExpired(nowUtc)
                && (shareToken.ClinicId == null || shareToken.ClinicId == clinicId);
        }

        private async Task<List<PrescriptionDomain>> LoadPrescriptionsAsync(
            List<MedicalExaminationDomain> examinations)
        {
            var prescriptions = new List<PrescriptionDomain>();
            foreach (var examination in examinations)
            {
                var items = await _prescriptionRepository.GetByExaminationIdAsync(examination.Id);
                prescriptions.AddRange(items);
            }

            return prescriptions
                .OrderByDescending(p => p.CreatedAt)
                .ToList();
        }

        private async Task<PetHealthOverviewOwnerResponse?> BuildOwnerAsync(
            Guid ownerUserId,
            string scope)
        {
            if (scope == PetHealthShareScope.EmergencySummary.ToString())
                return null;

            var user = await _userRepository.GetByIdAsync(ownerUserId);
            var profile = await _userProfileRepository.GetByUserIdAsync(ownerUserId);

            return new PetHealthOverviewOwnerResponse
            {
                OwnerUserId = ownerUserId,
                FullName = profile?.FullName,
                Phone = profile?.Phone,
                Email = user?.Email.Value
            };
        }

        private static PetHealthOverviewPetResponse MapPet(PetDomain pet)
        {
            return new PetHealthOverviewPetResponse
            {
                PetId = pet.Id,
                PublicPetCode = pet.PublicPetCode,
                Name = pet.Name,
                Species = pet.Species,
                Breed = pet.Breed,
                Gender = pet.Gender,
                DateOfBirth = pet.DateOfBirth,
                AgeText = FormatAge(pet.DateOfBirth),
                AvatarUrl = pet.AvatarUrl
            };
        }

        private static PetHealthOverviewProfileResponse MapHealthProfile(PetHealthProfileDomain profile)
        {
            return new PetHealthOverviewProfileResponse
            {
                CurrentWeightKg = profile.CurrentWeightKg,
                Color = profile.Color,
                IsNeutered = profile.IsNeutered,
                Allergies = profile.Allergies,
                ChronicConditions = profile.ChronicConditions,
                MicrochipNumber = profile.MicrochipNumber,
                UpdatedAt = profile.UpdatedAt ?? profile.CreatedAt
            };
        }

        private static List<PetHealthOverviewAlertResponse> BuildAlerts(
            PetHealthProfileDomain? healthProfile,
            List<PetMedicalRecordDomain> medicalRecords)
        {
            var alerts = new List<PetHealthOverviewAlertResponse>();

            if (!string.IsNullOrWhiteSpace(healthProfile?.Allergies))
            {
                alerts.Add(new PetHealthOverviewAlertResponse
                {
                    Type = "Allergy",
                    Title = healthProfile.Allergies!,
                    Severity = "High"
                });
            }

            if (!string.IsNullOrWhiteSpace(healthProfile?.ChronicConditions))
            {
                alerts.Add(new PetHealthOverviewAlertResponse
                {
                    Type = "ChronicCondition",
                    Title = healthProfile.ChronicConditions!,
                    Severity = "Medium"
                });
            }

            alerts.AddRange(medicalRecords
                .Where(r => r.RecordType.Equals("Allergy", StringComparison.OrdinalIgnoreCase))
                .Select(r => new PetHealthOverviewAlertResponse
                {
                    Type = "Allergy",
                    Title = r.Title,
                    Severity = "High"
                }));

            return alerts;
        }

        private static List<PetHealthOverviewMedicalRecordResponse> MapMedicalRecords(
            List<PetMedicalRecordDomain> records,
            string scope)
        {
            if (scope == PetHealthShareScope.EmergencySummary.ToString())
                return new List<PetHealthOverviewMedicalRecordResponse>();

            var isFull = scope == PetHealthShareScope.FullHealthProfile.ToString();

            return records.Select(record => new PetHealthOverviewMedicalRecordResponse
            {
                MedicalRecordId = record.Id,
                RecordType = record.RecordType,
                Title = record.Title,
                Description = record.Description,
                RecordDate = record.RecordDate,
                VetName = record.VetName,
                ClinicName = record.ClinicName,
                MedicationName = record.MedicationName,
                Dosage = record.Dosage,
                StartDate = record.StartDate,
                EndDate = record.EndDate,
                AttachmentUrl = isFull ? record.AttachmentUrl : null,
                CreatedAt = record.CreatedAt
            }).ToList();
        }

        private static List<PetHealthOverviewExaminationResponse> MapExaminations(
            List<MedicalExaminationDomain> examinations,
            string scope)
        {
            if (scope == PetHealthShareScope.EmergencySummary.ToString())
                return new List<PetHealthOverviewExaminationResponse>();

            var isFull = scope == PetHealthShareScope.FullHealthProfile.ToString();

            return examinations.Select(exam => new PetHealthOverviewExaminationResponse
            {
                ExaminationId = exam.Id,
                AppointmentId = exam.AppointmentId,
                VetClinicId = exam.VetClinicId,
                ChiefComplaint = exam.ChiefComplaint,
                WeightKg = exam.WeightKg,
                TemperatureC = exam.TemperatureC,
                HeartRate = exam.HeartRate,
                RespiratoryRate = exam.RespiratoryRate,
                ExaminationNotes = isFull ? exam.ExaminationNotes : null,
                Diagnosis = exam.Diagnosis,
                TreatmentPlan = isFull ? exam.TreatmentPlan : null,
                Status = exam.Status.ToString(),
                CreatedAt = exam.CreatedAt,
                CompletedAt = exam.CompletedAt
            }).ToList();
        }

        private static List<PetHealthOverviewPrescriptionResponse> MapPrescriptions(
            List<PrescriptionDomain> prescriptions,
            string scope)
        {
            if (scope == PetHealthShareScope.EmergencySummary.ToString())
                return new List<PetHealthOverviewPrescriptionResponse>();

            return prescriptions.Select(prescription => new PetHealthOverviewPrescriptionResponse
            {
                PrescriptionId = prescription.Id,
                ExaminationId = prescription.ExaminationId,
                MedicationName = prescription.MedicationName,
                Dosage = prescription.Dosage,
                Frequency = prescription.Frequency,
                DurationDays = prescription.DurationDays,
                Instructions = scope == PetHealthShareScope.FullHealthProfile.ToString()
                    ? prescription.Instructions
                    : null,
                InventoryItemId = prescription.InventoryItemId,
                CreatedAt = prescription.CreatedAt
            }).ToList();
        }

        private static List<PetHealthOverviewAppointmentResponse> MapAppointments(
            List<AppointmentDomain> appointments,
            string scope,
            Guid clinicId,
            string accessSource)
        {
            if (scope == PetHealthShareScope.EmergencySummary.ToString())
                return new List<PetHealthOverviewAppointmentResponse>();

            var visibleAppointments = scope == PetHealthShareScope.FullHealthProfile.ToString()
                && accessSource == "HealthShareCode"
                    ? appointments
                    : appointments.Where(a => a.ClinicId == clinicId).ToList();

            return visibleAppointments.Select(appointment => new PetHealthOverviewAppointmentResponse
            {
                AppointmentId = appointment.Id,
                ClinicId = appointment.ClinicId,
                VetClinicId = appointment.VetClinicId,
                ServiceId = appointment.ServiceId,
                AppointmentDate = appointment.AppointmentDate,
                StartTime = appointment.StartTime,
                EndTime = appointment.EndTime,
                AppointmentType = appointment.AppointmentType.ToString(),
                Status = appointment.Status.ToString(),
                Notes = scope == PetHealthShareScope.FullHealthProfile.ToString()
                    ? appointment.Notes
                    : null,
                IsWalkIn = appointment.IsWalkIn,
                CreatedAt = appointment.CreatedAt
            }).ToList();
        }

        private static string? FormatAge(DateOnly? dateOfBirth)
        {
            if (!dateOfBirth.HasValue)
                return null;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var totalMonths = (today.Year - dateOfBirth.Value.Year) * 12 + today.Month - dateOfBirth.Value.Month;
            if (today.Day < dateOfBirth.Value.Day)
                totalMonths--;

            if (totalMonths < 0)
                return null;

            if (totalMonths < 12)
                return $"{totalMonths} month{(totalMonths == 1 ? string.Empty : "s")}";

            var years = totalMonths / 12;
            var months = totalMonths % 12;
            return months == 0
                ? $"{years} year{(years == 1 ? string.Empty : "s")}"
                : $"{years} year{(years == 1 ? string.Empty : "s")} {months} month{(months == 1 ? string.Empty : "s")}";
        }
    }
}
