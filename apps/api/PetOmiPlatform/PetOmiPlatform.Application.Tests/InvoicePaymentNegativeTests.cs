using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Application.Features.Invoice.Handler;
using PetOmiPlatform.Application.Features.Invoice.Validation;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Tests;

public class InvoicePaymentNegativeTests
{
    [Fact]
    public async Task CreateInvoice_should_throw_forbidden_when_staff_role_is_not_invoice_writer()
    {
        var clinicId = Guid.NewGuid();
        var primaryVetUserId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var invoices = new InMemoryInvoiceRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(primaryVetUserId, clinicId, ClinicRoleConstants.PrimaryVetId);

        var appointment = CreateAppointment(clinicId, Guid.NewGuid(), Guid.NewGuid());
        await appointments.AddAsync(appointment);

        var handler = new CreateInvoiceCommandHandler(appointments, invoices, vetClinics, unitOfWork);
        var command = new CreateInvoiceCommand(
            clinicId,
            primaryVetUserId,
            CreateInvoiceRequest(appointment.Id, totalAmount: 100_000, discountAmount: 0));

        await Assert.ThrowsAsync<ForbiddenException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task CreateInvoice_should_throw_conflict_when_active_invoice_already_exists()
    {
        var clinicId = Guid.NewGuid();
        var assistantUserId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var invoices = new InMemoryInvoiceRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(assistantUserId, clinicId, ClinicRoleConstants.AssistantId);

        var appointment = CreateAppointment(clinicId, Guid.NewGuid(), Guid.NewGuid());
        await appointments.AddAsync(appointment);

        var existingInvoice = InvoiceDomain.Create(appointment.Id, clinicId, 200_000, 0);
        await invoices.AddAsync(existingInvoice);

        var handler = new CreateInvoiceCommandHandler(appointments, invoices, vetClinics, unitOfWork);
        var command = new CreateInvoiceCommand(
            clinicId,
            assistantUserId,
            CreateInvoiceRequest(appointment.Id, totalAmount: 120_000, discountAmount: 0));

        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public void CreateInvoice_validator_should_fail_when_discount_is_greater_than_total()
    {
        var command = new CreateInvoiceCommand(
            Guid.NewGuid(),
            Guid.NewGuid(),
            CreateInvoiceRequest(Guid.NewGuid(), totalAmount: 100_000, discountAmount: 150_000));

        var validator = new CreateInvoiceCommandValidator();
        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("DiscountAmount"));
    }

    [Fact]
    public void PayInvoice_validator_should_fail_for_invalid_payment_method()
    {
        var command = new PayInvoiceCommand(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            new PayInvoiceRequest { PaymentMethod = "CryptoCoin" });

        var validator = new PayInvoiceCommandValidator();
        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("PaymentMethod"));
    }

    [Fact]
    public async Task ManualMatch_should_throw_conflict_when_transfer_amount_is_less_than_invoice()
    {
        var clinicId = Guid.NewGuid();
        var assistantUserId = Guid.NewGuid();

        var vetClinics = new InMemoryVetClinicRepository();
        var transactions = new InMemoryPaymentTransactionRepository();
        var invoices = new InMemoryInvoiceRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(assistantUserId, clinicId, ClinicRoleConstants.AssistantId);

        var invoice = InvoiceDomain.Create(Guid.NewGuid(), clinicId, 300_000, 0);
        await invoices.AddAsync(invoice);

        var transaction = PaymentTransactionDomain.Create(
            clinicId: clinicId,
            provider: PaymentProvider.SePay,
            providerTransactionId: "tx-001",
            transferType: "in",
            transferAmount: 100_000,
            transferContent: invoice.InvoiceCode);
        await transactions.AddAsync(transaction);

        var handler = new ManualMatchSePayTransactionCommandHandler(vetClinics, transactions, invoices, unitOfWork);
        var command = new ManualMatchSePayTransactionCommand(
            clinicId,
            assistantUserId,
            transaction.Id,
            invoice.Id,
            "manual review");

        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Dismiss_should_throw_forbidden_when_transaction_is_in_other_clinic()
    {
        var clinicId = Guid.NewGuid();
        var otherClinicId = Guid.NewGuid();
        var assistantUserId = Guid.NewGuid();

        var vetClinics = new InMemoryVetClinicRepository();
        var transactions = new InMemoryPaymentTransactionRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(assistantUserId, clinicId, ClinicRoleConstants.AssistantId);

        var transaction = PaymentTransactionDomain.Create(
            clinicId: otherClinicId,
            provider: PaymentProvider.SePay,
            providerTransactionId: "tx-002",
            transferType: "in",
            transferAmount: 200_000,
            transferContent: "INVTEST");
        await transactions.AddAsync(transaction);

        var handler = new DismissSePayTransactionCommandHandler(vetClinics, transactions, unitOfWork);
        var command = new DismissSePayTransactionCommand(
            clinicId,
            assistantUserId,
            transaction.Id,
            "wrong target transaction");

        await Assert.ThrowsAsync<ForbiddenException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task AutoCompose_should_return_warning_when_medication_unit_price_is_zero()
    {
        var clinicId = Guid.NewGuid();
        var assistantUserId = Guid.NewGuid();
        var petId = Guid.NewGuid();
        var bookedByUserId = Guid.NewGuid();

        var appointments = new InMemoryAppointmentRepository();
        var services = new InMemoryClinicServiceRepository();
        var inventory = new InMemoryInventoryRepository();
        var invoices = new InMemoryInvoiceRepository();
        var examinations = new InMemoryMedicalExaminationRepository();
        var prescriptions = new InMemoryPrescriptionRepository();
        var vetClinics = new InMemoryVetClinicRepository();
        var unitOfWork = new TestUnitOfWork();

        vetClinics.AddStaff(assistantUserId, clinicId, ClinicRoleConstants.AssistantId);

        var appointment = CreateAppointment(clinicId, petId, bookedByUserId);
        await appointments.AddAsync(appointment);

        var examination = MedicalExaminationDomain.Create(
            appointmentId: appointment.Id,
            petId: petId,
            chiefComplaint: "Itchy ear");
        await examinations.AddAsync(examination);

        var inventoryItem = InventoryItemDomain.Create(
            clinicId: clinicId,
            itemName: "Ear drops",
            unit: "bottle",
            quantity: 10,
            lowStockThreshold: 2,
            unitPrice: null,
            expiryDate: null);
        await inventory.AddAsync(inventoryItem);

        var prescription = PrescriptionDomain.Create(
            examinationId: examination.Id,
            medicationName: "Ear drops",
            dosage: "2 drops",
            frequency: "Twice daily",
            durationDays: 7,
            inventoryItemId: inventoryItem.Id);
        await prescriptions.AddAsync(prescription);

        var handler = new AutoComposeInvoiceCommandHandler(
            appointments,
            services,
            inventory,
            invoices,
            examinations,
            prescriptions,
            vetClinics,
            unitOfWork);

        var command = new AutoComposeInvoiceCommand(
            clinicId,
            assistantUserId,
            new AutoComposeInvoiceRequest
            {
                AppointmentId = appointment.Id,
                ExaminationId = examination.Id,
                IncludeService = false,
                IncludePrescriptions = true
            });

        var response = await handler.Handle(command, CancellationToken.None);

        Assert.NotEmpty(response.Warnings);
        Assert.Contains(response.Warnings, x => x.Contains("UnitPrice = 0", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(response.Items, x => x.UnitPrice == 0);
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

    private static CreateInvoiceRequest CreateInvoiceRequest(Guid appointmentId, decimal totalAmount, decimal discountAmount)
    {
        return new CreateInvoiceRequest
        {
            AppointmentId = appointmentId,
            TotalAmount = totalAmount,
            DiscountAmount = discountAmount,
            Items =
            {
                new InvoiceItemRequest
                {
                    ItemType = InvoiceItemType.Service.ToString(),
                    Description = "Consultation fee",
                    Quantity = 1,
                    UnitPrice = totalAmount
                }
            }
        };
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
            => Task.FromResult(_appointments.Values.Where(a => a.ClinicId == clinicId));

        public Task<int> CountByClinicAsync(Guid clinicId, string? status, DateOnly? date)
            => Task.FromResult(_appointments.Values.Count(a => a.ClinicId == clinicId));

        public Task<IEnumerable<AppointmentDomain>> GetByOwnerAsync(Guid ownerUserId, int page, int pageSize)
            => Task.FromResult(_appointments.Values.Where(a => a.BookedByUserId == ownerUserId));

        public Task<int> CountByOwnerAsync(Guid ownerUserId)
            => Task.FromResult(_appointments.Values.Count(a => a.BookedByUserId == ownerUserId));

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

        public Task<InvoiceDomain?> GetByInvoiceCodeAsync(string invoiceCode)
            => Task.FromResult(_invoices.Values.FirstOrDefault(x => x.InvoiceCode == invoiceCode));

        public Task<InvoiceDomain?> GetByAppointmentIdAsync(Guid appointmentId)
            => Task.FromResult(_invoices.Values.FirstOrDefault(x => x.AppointmentId == appointmentId));

        public Task<InvoiceDomain?> GetByPaymentReferenceAsync(string paymentReference)
            => Task.FromResult(_invoices.Values.FirstOrDefault(x => x.PaymentReference == paymentReference));

        public Task<IEnumerable<InvoiceItemDomain>> GetItemsByInvoiceIdAsync(Guid invoiceId)
            => Task.FromResult(_items.Where(x => x.InvoiceId == invoiceId));

        public Task<IEnumerable<InvoiceDomain>> GetByClinicIdAsync(Guid clinicId, int page, int pageSize)
            => Task.FromResult(_invoices.Values.Where(x => x.ClinicId == clinicId));

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

    private sealed class InMemoryPaymentTransactionRepository : IPaymentTransactionRepository
    {
        private readonly Dictionary<Guid, PaymentTransactionDomain> _transactions = new();

        public Task<bool> ExistsByProviderTransactionIdAsync(PaymentProvider provider, string providerTransactionId)
        {
            return Task.FromResult(_transactions.Values.Any(x =>
                x.Provider == provider && x.ProviderTransactionId == providerTransactionId));
        }

        public Task<PaymentTransactionDomain?> GetByIdAsync(Guid paymentTransactionId)
        {
            _transactions.TryGetValue(paymentTransactionId, out var tx);
            return Task.FromResult(tx);
        }

        public Task AddAsync(PaymentTransactionDomain transaction)
        {
            _transactions[transaction.Id] = transaction;
            return Task.CompletedTask;
        }

        public Task MarkMatchedAsync(Guid transactionId, Guid invoiceId, Guid? reviewedByUserId = null, string? reviewNote = null)
        {
            if (_transactions.TryGetValue(transactionId, out var tx))
            {
                tx.MarkMatched(invoiceId);
            }

            return Task.CompletedTask;
        }

        public Task MarkDismissedAsync(Guid transactionId, Guid reviewedByUserId, string reviewNote)
        {
            if (_transactions.TryGetValue(transactionId, out var tx))
            {
                tx.MarkMatched(Guid.Empty);
            }

            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<PaymentTransactionDomain>> GetRecentByClinicIdAsync(Guid clinicId, int limit, bool includeMatched)
        {
            var query = _transactions.Values.Where(x => x.ClinicId == clinicId);
            if (!includeMatched)
            {
                query = query.Where(x => !x.IsMatched);
            }

            return Task.FromResult((IReadOnlyList<PaymentTransactionDomain>)query.Take(limit).ToList());
        }
    }

    private sealed class InMemoryClinicServiceRepository : IClinicServiceRepository
    {
        private readonly Dictionary<Guid, ClinicServiceDomain> _services = new();

        public Task AddAsync(ClinicServiceDomain service)
        {
            _services[service.Id] = service;
            return Task.CompletedTask;
        }

        public Task<ClinicServiceDomain?> GetByIdAsync(Guid serviceId)
        {
            _services.TryGetValue(serviceId, out var service);
            return Task.FromResult(service);
        }

        public Task<IEnumerable<ClinicServiceDomain>> GetByClinicIdAsync(Guid clinicId, bool activeOnly = true)
            => Task.FromResult(_services.Values.Where(x => x.ClinicId == clinicId));

        public Task UpdateAsync(ClinicServiceDomain service)
        {
            _services[service.Id] = service;
            return Task.CompletedTask;
        }
    }

    private sealed class InMemoryInventoryRepository : IInventoryRepository
    {
        private readonly Dictionary<Guid, InventoryItemDomain> _items = new();

        public Task AddAsync(InventoryItemDomain item)
        {
            _items[item.Id] = item;
            return Task.CompletedTask;
        }

        public Task<InventoryItemDomain?> GetByIdAsync(Guid itemId)
        {
            _items.TryGetValue(itemId, out var item);
            return Task.FromResult(item);
        }

        public Task<IEnumerable<InventoryItemDomain>> GetByClinicIdAsync(Guid clinicId, bool activeOnly = true)
            => Task.FromResult(_items.Values.Where(x => x.ClinicId == clinicId));

        public Task<IEnumerable<InventoryItemDomain>> GetLowStockItemsAsync(Guid clinicId)
            => Task.FromResult(_items.Values.Where(x => x.ClinicId == clinicId && x.IsLowStock));

        public Task UpdateAsync(InventoryItemDomain item)
        {
            _items[item.Id] = item;
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
