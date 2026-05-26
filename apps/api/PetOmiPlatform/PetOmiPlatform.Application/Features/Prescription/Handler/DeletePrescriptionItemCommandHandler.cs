using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Prescription.Command;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.Prescription.Handler
{
    public class DeletePrescriptionItemCommandHandler : IRequestHandler<DeletePrescriptionItemCommand, bool>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeletePrescriptionItemCommandHandler(
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

        public async Task<bool> Handle(DeletePrescriptionItemCommand request, CancellationToken cancellationToken)
        {
            var prescription = await _prescriptionRepository.GetByIdAsync(request.PrescriptionId);
            if (prescription == null)
                throw new NotFoundException($"Không tìm thấy thuốc kê đơn ID {request.PrescriptionId}");

            var exam = await _examinationRepository.GetByIdAsync(prescription.ExaminationId);
            if (exam == null)
                throw new NotFoundException($"Khong tim thay phieu kham ID {prescription.ExaminationId}");

            var appointment = await _appointmentRepository.GetByIdAsync(exam.AppointmentId);

            if (appointment == null || appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền xóa thuốc trong đơn này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequirePrescriptionWriter(staff);

            await _prescriptionRepository.DeleteAsync(request.PrescriptionId);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
