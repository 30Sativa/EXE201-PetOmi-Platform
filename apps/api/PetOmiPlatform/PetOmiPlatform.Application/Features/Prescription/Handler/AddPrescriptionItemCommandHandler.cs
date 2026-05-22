using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Prescription.Command;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;
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
        private readonly IUnitOfWork _unitOfWork;

        public AddPrescriptionItemCommandHandler(
            IMedicalExaminationRepository examinationRepository,
            IAppointmentRepository appointmentRepository,
            IPrescriptionRepository prescriptionRepository,
            IUnitOfWork unitOfWork)
        {
            _examinationRepository = examinationRepository;
            _appointmentRepository = appointmentRepository;
            _prescriptionRepository = prescriptionRepository;
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

            return new PrescriptionItemResponse
            {
                Id = prescription.Id,
                ExaminationId = prescription.ExaminationId,
                MedicationName = prescription.MedicationName,
                Dosage = prescription.Dosage,
                Frequency = prescription.Frequency,
                DurationDays = prescription.DurationDays,
                Instructions = prescription.Instructions,
                InventoryItemId = prescription.InventoryItemId,
                CreatedAt = prescription.CreatedAt
            };
        }
    }
}
