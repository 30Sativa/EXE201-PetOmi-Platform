using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.MedicalExamination.Command;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Request;
using PetOmiPlatform.Application.Features.MedicalExamination.Handler;
using PetOmiPlatform.Application.Features.Prescription.Command;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Request;
using PetOmiPlatform.Application.Features.Prescription.Handler;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Exceptions;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Tests;

public class ExaminationPrescriptionNegativeTests
{
    [Fact]
    public async Task CreateExamination_should_throw_conflict_when_appointment_already_has_examination()
    {
        var clinicId = Guid.NewGuid();
        var vetUserId = Guid.NewGuid();
        var petId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var examinations = new InMemoryMedicalExaminationRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(vetUserId, clinicId, ClinicRoleConstants.PrimaryVetId);

        var appointment = CreateAppointment(clinicId, petId, Guid.NewGuid());
        await appointments.AddAsync(appointment);

        var existingExam = MedicalExaminationDomain.Create(
            appointmentId: appointment.Id,
            petId: petId,
            chiefComplaint: "Existing exam");
        await examinations.AddAsync(existingExam);

        var handler = new CreateExaminationCommandHandler(examinations, appointments, vetClinics, unitOfWork);
        var command = new CreateExaminationCommand(
            clinicId,
            vetUserId,
            new CreateExaminationRequest
            {
                AppointmentId = appointment.Id,
                ChiefComplaint = "New exam"
            });

        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task CreateExamination_should_throw_forbidden_when_staff_is_assistant()
    {
        var clinicId = Guid.NewGuid();
        var assistantUserId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var examinations = new InMemoryMedicalExaminationRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(assistantUserId, clinicId, ClinicRoleConstants.AssistantId);

        var appointment = CreateAppointment(clinicId, Guid.NewGuid(), Guid.NewGuid());
        await appointments.AddAsync(appointment);

        var handler = new CreateExaminationCommandHandler(examinations, appointments, vetClinics, unitOfWork);
        var command = new CreateExaminationCommand(
            clinicId,
            assistantUserId,
            new CreateExaminationRequest
            {
                AppointmentId = appointment.Id,
                ChiefComplaint = "Pet has fever"
            });

        await Assert.ThrowsAsync<ForbiddenException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task CompleteExamination_should_throw_domain_exception_when_diagnosis_is_missing()
    {
        var clinicId = Guid.NewGuid();
        var vetUserId = Guid.NewGuid();
        var petId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var examinations = new InMemoryMedicalExaminationRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(vetUserId, clinicId, ClinicRoleConstants.PrimaryVetId);

        var appointment = CreateAppointment(clinicId, petId, Guid.NewGuid());
        await appointments.AddAsync(appointment);

        var exam = MedicalExaminationDomain.Create(
            appointmentId: appointment.Id,
            petId: petId,
            chiefComplaint: "Pet not eating");
        await examinations.AddAsync(exam);

        var handler = new CompleteExaminationCommandHandler(examinations, appointments, vetClinics, unitOfWork);
        var command = new CompleteExaminationCommand(clinicId, vetUserId, exam.Id);

        await Assert.ThrowsAsync<DomainException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task AddPrescription_should_throw_forbidden_when_staff_is_assistant()
    {
        var clinicId = Guid.NewGuid();
        var assistantUserId = Guid.NewGuid();
        var petId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var examinations = new InMemoryMedicalExaminationRepository();
        var prescriptions = new InMemoryPrescriptionRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(assistantUserId, clinicId, ClinicRoleConstants.AssistantId);

        var appointment = CreateAppointment(clinicId, petId, Guid.NewGuid());
        await appointments.AddAsync(appointment);

        var exam = MedicalExaminationDomain.Create(
            appointmentId: appointment.Id,
            petId: petId,
            chiefComplaint: "Ear pain");
        await examinations.AddAsync(exam);

        var handler = new AddPrescriptionItemCommandHandler(examinations, appointments, prescriptions, vetClinics, unitOfWork);
        var command = new AddPrescriptionItemCommand(
            clinicId,
            assistantUserId,
            exam.Id,
            new AddPrescriptionItemRequest
            {
                MedicationName = "Ear drops",
                Dosage = "2 drops",
                Frequency = "Twice daily",
                DurationDays = 5
            });

        await Assert.ThrowsAsync<ForbiddenException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task UpdatePrescription_should_throw_not_found_when_examination_is_missing()
    {
        var clinicId = Guid.NewGuid();
        var vetUserId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var examinations = new InMemoryMedicalExaminationRepository();
        var prescriptions = new InMemoryPrescriptionRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(vetUserId, clinicId, ClinicRoleConstants.PrimaryVetId);

        var prescription = PrescriptionDomain.Create(
            examinationId: Guid.NewGuid(),
            medicationName: "Med A",
            dosage: "1 pill",
            frequency: "Daily",
            durationDays: 3);
        await prescriptions.AddAsync(prescription);

        var handler = new UpdatePrescriptionItemCommandHandler(examinations, appointments, prescriptions, vetClinics, unitOfWork);
        var command = new UpdatePrescriptionItemCommand(
            clinicId,
            vetUserId,
            prescription.Id,
            new UpdatePrescriptionItemRequest { Dosage = "2 pills" });

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task DeletePrescription_should_throw_not_found_when_examination_is_missing()
    {
        var clinicId = Guid.NewGuid();
        var vetUserId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var examinations = new InMemoryMedicalExaminationRepository();
        var prescriptions = new InMemoryPrescriptionRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(vetUserId, clinicId, ClinicRoleConstants.PrimaryVetId);

        var prescription = PrescriptionDomain.Create(
            examinationId: Guid.NewGuid(),
            medicationName: "Med B",
            dosage: "5ml",
            frequency: "Twice daily",
            durationDays: 7);
        await prescriptions.AddAsync(prescription);

        var handler = new DeletePrescriptionItemCommandHandler(examinations, appointments, prescriptions, vetClinics, unitOfWork);
        var command = new DeletePrescriptionItemCommand(clinicId, vetUserId, prescription.Id);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(command, CancellationToken.None));
    }

    private static AppointmentDomain CreateAppointment(Guid clinicId, Guid petId, Guid bookedByUserId)
    {
        return AppointmentDomain.CreateWalkIn(
            clinicId: clinicId,
            petId: petId,
            staffUserId: bookedByUserId,
            appointmentDate: DateOnly.FromDateTime(DateTime.UtcNow),
            startTime: new TimeOnly(9, 0),
            endTime: new TimeOnly(9, 30),
            appointmentType: AppointmentType.Checkup);
    }

    private sealed class TestUnitOfWork : IUnitOfWork
    {
        public Task BeginTransactionAsync() => Task.CompletedTask;
        public Task CommitTransactionAsync() => Task.CompletedTask;
        public Task RollbackTransactionAsync() => Task.CompletedTask;
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken) => Task.FromResult(1);
    }

    private sealed class InMemoryVetClinicRepository : IVetClinicRepository
    {
        private readonly Dictionary<(Guid UserId, Guid ClinicId), VetClinicDomain> _staff = new();

        public void AddStaff(Guid userId, Guid clinicId, Guid roleId)
        {
            _staff[(userId, clinicId)] = new VetClinicDomain(Guid.NewGuid(), clinicId, roleId);
        }

        public Task AddClinicOwnerAsync(Guid vetProfileId, Guid clinicId) => Task.CompletedTask;
        public Task DeactivateByClinicIdAsync(Guid clinicId) => Task.CompletedTask;
        public Task AddAsync(VetClinicDomain vetClinic) => Task.CompletedTask;
        public Task<bool> IsClinicOwnerAsync(Guid userId, Guid clinicId) => Task.FromResult(false);
        public Task<bool> ExistsAsync(Guid vetProfileId, Guid clinicId) => Task.FromResult(false);
        public Task<bool> IsClinicApprovedAsync(Guid clinicId) => Task.FromResult(true);
        public Task<VetClinicDomain?> GetByVetClinicIdAsync(Guid vetClinicId) => Task.FromResult<VetClinicDomain?>(null);
        public Task<List<Guid>> GetAllVetClinicIdsAsync(Guid vetProfileId) => Task.FromResult(new List<Guid>());
        public Task<List<ClinicDoctorDto>> GetClinicDoctorsAsync(Guid clinicId) => Task.FromResult(new List<ClinicDoctorDto>());

        public Task<VetClinicDomain?> GetByUserIdAndClinicIdAsync(Guid userId, Guid clinicId)
        {
            _staff.TryGetValue((userId, clinicId), out var staff);
            return Task.FromResult(staff);
        }
    }

    private sealed class InMemoryAppointmentRepository : IAppointmentRepository
    {
        private readonly Dictionary<Guid, AppointmentDomain> _appointments = new();

        public Task AddAsync(AppointmentDomain appointment)
        {
            _appointments[appointment.Id] = appointment;
            return Task.CompletedTask;
        }

        public Task<AppointmentDomain?> GetByIdAsync(Guid appointmentId)
        {
            _appointments.TryGetValue(appointmentId, out var appointment);
            return Task.FromResult(appointment);
        }

        public Task<IEnumerable<AppointmentDomain>> GetByClinicAsync(Guid clinicId, string? status, DateOnly? date, int page, int pageSize)
            => Task.FromResult(_appointments.Values.Where(x => x.ClinicId == clinicId));

        public Task<int> CountByClinicAsync(Guid clinicId, string? status, DateOnly? date)
            => Task.FromResult(_appointments.Values.Count(x => x.ClinicId == clinicId));

        public Task<IEnumerable<AppointmentDomain>> GetByOwnerAsync(Guid ownerUserId, int page, int pageSize)
            => Task.FromResult(_appointments.Values.Where(x => x.BookedByUserId == ownerUserId));

        public Task<int> CountByOwnerAsync(Guid ownerUserId)
            => Task.FromResult(_appointments.Values.Count(x => x.BookedByUserId == ownerUserId));

        public Task<bool> HasConflictAsync(Guid vetClinicId, DateOnly date, TimeOnly startTime, TimeOnly endTime, Guid? excludeId = null)
            => Task.FromResult(false);

        public Task<bool> HasDoctorConflictAcrossClinicsAsync(List<Guid> allVetClinicIds, DateOnly date, TimeOnly startTime, TimeOnly endTime)
            => Task.FromResult(false);

        public Task<IEnumerable<AppointmentDomain>> GetPendingExpiredAsync(int timeoutMinutes = 30)
            => Task.FromResult(Enumerable.Empty<AppointmentDomain>());

        public Task UpdateAsync(AppointmentDomain appointment)
        {
            _appointments[appointment.Id] = appointment;
            return Task.CompletedTask;
        }
    }

    private sealed class InMemoryMedicalExaminationRepository : IMedicalExaminationRepository
    {
        private readonly Dictionary<Guid, MedicalExaminationDomain> _examinations = new();

        public Task AddAsync(MedicalExaminationDomain examination)
        {
            _examinations[examination.Id] = examination;
            return Task.CompletedTask;
        }

        public Task<MedicalExaminationDomain?> GetByIdAsync(Guid examinationId)
        {
            _examinations.TryGetValue(examinationId, out var exam);
            return Task.FromResult(exam);
        }

        public Task<MedicalExaminationDomain?> GetByAppointmentIdAsync(Guid appointmentId)
            => Task.FromResult(_examinations.Values.FirstOrDefault(x => x.AppointmentId == appointmentId));

        public Task<IEnumerable<MedicalExaminationDomain>> GetByPetIdAsync(Guid petId, int page, int pageSize)
            => Task.FromResult(_examinations.Values.Where(x => x.PetId == petId));

        public Task UpdateAsync(MedicalExaminationDomain examination)
        {
            _examinations[examination.Id] = examination;
            return Task.CompletedTask;
        }
    }

    private sealed class InMemoryPrescriptionRepository : IPrescriptionRepository
    {
        private readonly Dictionary<Guid, PrescriptionDomain> _prescriptions = new();

        public Task AddAsync(PrescriptionDomain prescription)
        {
            _prescriptions[prescription.Id] = prescription;
            return Task.CompletedTask;
        }

        public Task<PrescriptionDomain?> GetByIdAsync(Guid prescriptionId)
        {
            _prescriptions.TryGetValue(prescriptionId, out var value);
            return Task.FromResult(value);
        }

        public Task<IEnumerable<PrescriptionDomain>> GetByExaminationIdAsync(Guid examinationId)
            => Task.FromResult(_prescriptions.Values.Where(x => x.ExaminationId == examinationId));

        public Task UpdateAsync(PrescriptionDomain prescription)
        {
            _prescriptions[prescription.Id] = prescription;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid prescriptionId)
        {
            _prescriptions.Remove(prescriptionId);
            return Task.CompletedTask;
        }
    }
}
