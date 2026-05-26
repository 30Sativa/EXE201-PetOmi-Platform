using PetOmiPlatform.Application.Features.Appointment.CheckIn.Command;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.Handler;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Application.Features.Invoice.Handler;
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
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Tests;

public class ClinicVisitFlowSmokeTests
{
    [Fact]
    public async Task Clinic_visit_flow_can_check_in_examine_prescribe_invoice_and_pay()
    {
        var clinicId = Guid.NewGuid();
        var petId = Guid.NewGuid();
        var assistantUserId = Guid.NewGuid();
        var vetUserId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var examinations = new InMemoryMedicalExaminationRepository();
        var prescriptions = new InMemoryPrescriptionRepository();
        var invoices = new InMemoryInvoiceRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(assistantUserId, clinicId, ClinicRoleConstants.AssistantId);
        vetClinics.AddStaff(vetUserId, clinicId, ClinicRoleConstants.PrimaryVetId);

        var appointment = AppointmentDomain.CreateWalkIn(
            clinicId: clinicId,
            petId: petId,
            staffUserId: assistantUserId,
            appointmentDate: DateOnly.FromDateTime(DateTime.UtcNow),
            startTime: new TimeOnly(9, 0),
            endTime: new TimeOnly(9, 30),
            appointmentType: AppointmentType.Checkup);
        await appointments.AddAsync(appointment);

        var checkInHandler = new CheckInCommandHandler(appointments, vetClinics, unitOfWork);
        var checkIn = await checkInHandler.Handle(
            new CheckInCommand(appointment.Id, clinicId, assistantUserId),
            CancellationToken.None);

        Assert.Equal(AppointmentStatus.CheckedIn.ToString(), checkIn.Status);
        Assert.Equal(assistantUserId, checkIn.CheckedInByUserId);

        var createExamHandler = new CreateExaminationCommandHandler(
            examinations,
            appointments,
            vetClinics,
            unitOfWork);
        var exam = await createExamHandler.Handle(
            new CreateExaminationCommand(
                clinicId,
                vetUserId,
                new CreateExaminationRequest
                {
                    AppointmentId = appointment.Id,
                    ChiefComplaint = "Pet has ear irritation",
                    Diagnosis = "Otitis externa",
                    TreatmentPlan = "Clean ear and prescribe drops"
                }),
            CancellationToken.None);

        Assert.Equal(ExaminationStatus.InProgress.ToString(), exam.Status);
        Assert.Equal(petId, exam.PetId);

        var addPrescriptionHandler = new AddPrescriptionItemCommandHandler(
            examinations,
            appointments,
            prescriptions,
            vetClinics,
            unitOfWork);
        var prescription = await addPrescriptionHandler.Handle(
            new AddPrescriptionItemCommand(
                clinicId,
                vetUserId,
                exam.Id,
                new AddPrescriptionItemRequest
                {
                    MedicationName = "Ear drops",
                    Dosage = "2 drops",
                    Frequency = "Twice daily",
                    DurationDays = 7,
                    Instructions = "Apply after cleaning"
                }),
            CancellationToken.None);

        Assert.Equal(exam.Id, prescription.ExaminationId);
        Assert.Equal("Ear drops", prescription.MedicationName);

        var createInvoiceHandler = new CreateInvoiceCommandHandler(
            appointments,
            invoices,
            vetClinics,
            unitOfWork);
        var invoice = await createInvoiceHandler.Handle(
            new CreateInvoiceCommand(
                clinicId,
                assistantUserId,
                new CreateInvoiceRequest
                {
                    AppointmentId = appointment.Id,
                    ExaminationId = exam.Id,
                    TotalAmount = 350_000,
                    DiscountAmount = 50_000,
                    Notes = "Clinic visit invoice",
                    Items =
                    {
                        new InvoiceItemRequest
                        {
                            ItemType = InvoiceItemType.Service.ToString(),
                            Description = "General examination",
                            Quantity = 1,
                            UnitPrice = 200_000
                        },
                        new InvoiceItemRequest
                        {
                            ItemType = InvoiceItemType.Medication.ToString(),
                            Description = "Ear drops",
                            Quantity = 1,
                            UnitPrice = 150_000
                        }
                    }
                }),
            CancellationToken.None);

        Assert.Equal(InvoiceStatus.Unpaid.ToString(), invoice.Status);
        Assert.Equal(300_000, invoice.FinalAmount);
        Assert.Equal(2, invoice.Items.Count);

        var payInvoiceHandler = new PayInvoiceCommandHandler(invoices, vetClinics, unitOfWork);
        var paid = await payInvoiceHandler.Handle(
            new PayInvoiceCommand(
                clinicId,
                assistantUserId,
                invoice.Id,
                new PayInvoiceRequest { PaymentMethod = PaymentMethod.Cash.ToString() }),
            CancellationToken.None);

        var paidInvoice = await invoices.GetByIdAsync(invoice.Id);
        Assert.True(paid);
        Assert.NotNull(paidInvoice);
        Assert.Equal(InvoiceStatus.Paid, paidInvoice.Status);
        Assert.Equal(PaymentMethod.Cash, paidInvoice.PaymentMethod);
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

        public Task<IEnumerable<AppointmentDomain>> GetByClinicAsync(
            Guid clinicId,
            string? status,
            DateOnly? date,
            int page,
            int pageSize) => Task.FromResult(_appointments.Values.Where(a => a.ClinicId == clinicId));

        public Task<int> CountByClinicAsync(Guid clinicId, string? status, DateOnly? date)
            => Task.FromResult(_appointments.Values.Count(a => a.ClinicId == clinicId));

        public Task<IEnumerable<AppointmentDomain>> GetByOwnerAsync(Guid ownerUserId, int page, int pageSize)
            => Task.FromResult(_appointments.Values.Where(a => a.BookedByUserId == ownerUserId));

        public Task<int> CountByOwnerAsync(Guid ownerUserId)
            => Task.FromResult(_appointments.Values.Count(a => a.BookedByUserId == ownerUserId));

        public Task<bool> HasConflictAsync(
            Guid vetClinicId,
            DateOnly date,
            TimeOnly startTime,
            TimeOnly endTime,
            Guid? excludeId = null) => Task.FromResult(false);

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
            _examinations.TryGetValue(examinationId, out var examination);
            return Task.FromResult(examination);
        }

        public Task<MedicalExaminationDomain?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            return Task.FromResult(_examinations.Values.FirstOrDefault(e => e.AppointmentId == appointmentId));
        }

        public Task<IEnumerable<MedicalExaminationDomain>> GetByPetIdAsync(Guid petId, int page, int pageSize)
        {
            return Task.FromResult(_examinations.Values.Where(e => e.PetId == petId));
        }

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
            _prescriptions.TryGetValue(prescriptionId, out var prescription);
            return Task.FromResult(prescription);
        }

        public Task<IEnumerable<PrescriptionDomain>> GetByExaminationIdAsync(Guid examinationId)
        {
            return Task.FromResult(_prescriptions.Values.Where(p => p.ExaminationId == examinationId));
        }

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

    private sealed class InMemoryInvoiceRepository : IInvoiceRepository
    {
        private readonly Dictionary<Guid, InvoiceDomain> _invoices = new();
        private readonly List<InvoiceItemDomain> _items = new();

        public Task AddAsync(InvoiceDomain invoice)
        {
            _invoices[invoice.Id] = invoice;
            return Task.CompletedTask;
        }

        public Task AddItemsAsync(IEnumerable<InvoiceItemDomain> items)
        {
            _items.AddRange(items);
            return Task.CompletedTask;
        }

        public Task<InvoiceDomain?> GetByIdAsync(Guid invoiceId)
        {
            _invoices.TryGetValue(invoiceId, out var invoice);
            return Task.FromResult(invoice);
        }

        public Task<InvoiceDomain?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            return Task.FromResult(_invoices.Values.FirstOrDefault(i => i.AppointmentId == appointmentId));
        }

        public Task<IEnumerable<InvoiceItemDomain>> GetItemsByInvoiceIdAsync(Guid invoiceId)
        {
            return Task.FromResult(_items.Where(i => i.InvoiceId == invoiceId));
        }

        public Task<IEnumerable<InvoiceDomain>> GetByClinicIdAsync(Guid clinicId, int page, int pageSize)
        {
            return Task.FromResult(_invoices.Values.Where(i => i.ClinicId == clinicId));
        }

        public Task<bool> HasActiveInvoiceAsync(Guid appointmentId)
        {
            return Task.FromResult(_invoices.Values.Any(i =>
                i.AppointmentId == appointmentId &&
                i.Status is InvoiceStatus.Unpaid or InvoiceStatus.Paid));
        }

        public Task UpdateAsync(InvoiceDomain invoice)
        {
            _invoices[invoice.Id] = invoice;
            return Task.CompletedTask;
        }
    }
}
