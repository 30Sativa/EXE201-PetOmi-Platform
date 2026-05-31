using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Prescription.Command;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;
using PetOmiPlatform.Application.Features.Prescription.Mappers;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.Prescription.Handler
{
    public class AddPrescriptionItemCommandHandler : IRequestHandler<AddPrescriptionItemCommand, PrescriptionItemResponse>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AddPrescriptionItemCommandHandler(
            IMedicalExaminationRepository examinationRepository,
            IAppointmentRepository appointmentRepository,
            IPrescriptionRepository prescriptionRepository,
            IVetClinicRepository vetClinicRepository,
            IInventoryRepository inventoryRepository,
            IUnitOfWork unitOfWork)
        {
            _examinationRepository = examinationRepository;
            _appointmentRepository = appointmentRepository;
            _prescriptionRepository = prescriptionRepository;
            _vetClinicRepository = vetClinicRepository;
            _inventoryRepository = inventoryRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PrescriptionItemResponse> Handle(AddPrescriptionItemCommand request, CancellationToken cancellationToken)
        {
            var exam = await _examinationRepository.GetByIdAsync(request.ExaminationId);
            if (exam == null)
                throw new NotFoundException($"Không tìm thấy phiếu khám ID {request.ExaminationId}");

            var appointment = await _appointmentRepository.GetByIdAsync(exam.AppointmentId);
            if (appointment == null || appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền kê đơn cho phiếu khám này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequirePrescriptionWriter(staff);

            if (request.Payload.InventoryItemId.HasValue)
            {
                var item = await _inventoryRepository.GetByIdAsync(request.Payload.InventoryItemId.Value)
                    ?? throw new NotFoundException("InventoryItem", request.Payload.InventoryItemId.Value);
                if (item.ClinicId != request.ClinicId || !item.IsActive)
                    throw new ValidationException("InventoryItemId", "Vat tu/thuoc khong thuoc clinic hoac da ngung hoat dong.");
            }

            var prescription = PrescriptionDomain.Create(
                examinationId: exam.Id,
                medicationName: request.Payload.MedicationName,
                dosage: request.Payload.Dosage,
                frequency: request.Payload.Frequency,
                durationDays: request.Payload.DurationDays,
                instructions: request.Payload.Instructions,
                inventoryItemId: request.Payload.InventoryItemId
            );

            await _prescriptionRepository.AddAsync(prescription);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return prescription.ToResponse();
        }
    }
}
