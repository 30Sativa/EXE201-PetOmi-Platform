using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Application.Features.MedicalExamination.Mappers;
using PetOmiPlatform.Application.Features.MedicalExamination.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Handler
{
    public class GetExaminationByAppointmentQueryHandler : IRequestHandler<GetExaminationByAppointmentQuery, ExaminationResponse?>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetExaminationByAppointmentQueryHandler(
            IMedicalExaminationRepository examinationRepository,
            IAppointmentRepository appointmentRepository,
            IVetClinicRepository vetClinicRepository)
        {
            _examinationRepository = examinationRepository;
            _appointmentRepository = appointmentRepository;
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<ExaminationResponse?> Handle(GetExaminationByAppointmentQuery request, CancellationToken cancellationToken)
        {
            var exam = await _examinationRepository.GetByAppointmentIdAsync(request.AppointmentId);
            if (exam == null) return null;

            var appointment = await _appointmentRepository.GetByIdAsync(exam.AppointmentId);
            if (appointment == null)
                throw new NotFoundException($"Khong tim thay lich hen ID {exam.AppointmentId}");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.UserId, appointment.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            return exam.ToResponse();
        }
    }
}
