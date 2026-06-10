using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;
using PetOmiPlatform.Application.Features.Prescription.Mappers;
using PetOmiPlatform.Application.Features.Prescription.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Prescription.Handler
{
    public class GetPrescriptionsByExaminationQueryHandler : IRequestHandler<GetPrescriptionsByExaminationQuery, IEnumerable<PrescriptionItemResponse>>
    {
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetPrescriptionsByExaminationQueryHandler(
            IPrescriptionRepository prescriptionRepository,
            IMedicalExaminationRepository examinationRepository,
            IAppointmentRepository appointmentRepository,
            IVetClinicRepository vetClinicRepository)
        {
            _prescriptionRepository = prescriptionRepository;
            _examinationRepository = examinationRepository;
            _appointmentRepository = appointmentRepository;
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<IEnumerable<PrescriptionItemResponse>> Handle(GetPrescriptionsByExaminationQuery request, CancellationToken cancellationToken)
        {
            var exam = await _examinationRepository.GetByIdAsync(request.ExaminationId);
            if (exam == null)
                throw new NotFoundException($"Không tìm thấy phiếu khám ID {request.ExaminationId}");

            var appointment = await _appointmentRepository.GetByIdAsync(exam.AppointmentId);
            if (appointment == null || appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền xem đơn thuốc của phiếu khám này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var prescriptions = await _prescriptionRepository.GetByExaminationIdAsync(request.ExaminationId);

            return prescriptions.Select(p => p.ToResponse());
        }
    }
}
