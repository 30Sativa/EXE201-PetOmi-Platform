using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Prescription.Command;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;
using PetOmiPlatform.Application.Features.Prescription.Mappers;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.Prescription.Handler
{
    public class UpdatePrescriptionItemCommandHandler : IRequestHandler<UpdatePrescriptionItemCommand, PrescriptionItemResponse>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdatePrescriptionItemCommandHandler(
            IMedicalExaminationRepository examinationRepository,
            IAppointmentRepository appointmentRepository,
            IPrescriptionRepository prescriptionRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _examinationRepository = examinationRepository;
            _appointmentRepository = appointmentRepository;
            _prescriptionRepository = prescriptionRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PrescriptionItemResponse> Handle(UpdatePrescriptionItemCommand request, CancellationToken cancellationToken)
        {
            var prescription = await _prescriptionRepository.GetByIdAsync(request.PrescriptionId);
            if (prescription == null)
                throw new NotFoundException($"Không tìm thấy thuốc kê đơn ID {request.PrescriptionId}");

            var exam = await _examinationRepository.GetByIdAsync(prescription.ExaminationId);
            var appointment = await _appointmentRepository.GetByIdAsync(exam!.AppointmentId);

            if (appointment == null || appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền cập nhật thuốc trong đơn này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequirePrescriptionWriter(staff);

            prescription.Update(
                medicationName: request.Payload.MedicationName,
                dosage: request.Payload.Dosage,
                frequency: request.Payload.Frequency,
                durationDays: request.Payload.DurationDays,
                instructions: request.Payload.Instructions,
                inventoryItemId: request.Payload.InventoryItemId
            );

            await _prescriptionRepository.UpdateAsync(prescription);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return prescription.ToResponse();
        }
    }
}
