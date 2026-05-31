using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class GetClinicAppointmentsQueryHandler
        : IRequestHandler<Query.GetClinicAppointmentsQuery, PagedData<AppointmentListItemResponse>>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetClinicAppointmentsQueryHandler(
            IAppointmentRepository appointmentRepository,
            IVetClinicRepository vetClinicRepository)
        {
            _appointmentRepository = appointmentRepository;
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<PagedData<AppointmentListItemResponse>> Handle(
            Query.GetClinicAppointmentsQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(
                request.RequestUserId,
                request.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var items = await _appointmentRepository.GetByClinicAsync(
                request.ClinicId, request.Status, request.Date, request.Page, request.PageSize);

            var total = await _appointmentRepository.CountByClinicAsync(
                request.ClinicId, request.Status, request.Date);

            return new PagedData<AppointmentListItemResponse>
            {
                Items = items.Select(d => new AppointmentListItemResponse
                {
                    AppointmentId = d.Id,
                    PetId = d.PetId,
                    VetClinicId = d.VetClinicId,
                    AppointmentDate = d.AppointmentDate,
                    StartTime = d.StartTime,
                    EndTime = d.EndTime,
                    AppointmentType = d.AppointmentType.ToString(),
                    Status = d.Status.ToString(),
                    IsWalkIn = d.IsWalkIn,
                    CreatedAt = d.CreatedAt
                }).ToList(),
                Meta = new PaginationMeta<AppointmentListItemResponse>
                {
                    PageNumber = request.Page,
                    PageSize = request.PageSize,
                    TotalRecords = total
                }
            };
        }
    }

    public class GetOwnerAppointmentsQueryHandler
        : IRequestHandler<Query.GetOwnerAppointmentsQuery, PagedData<AppointmentListItemResponse>>
    {
        private readonly IAppointmentRepository _appointmentRepository;

        public GetOwnerAppointmentsQueryHandler(IAppointmentRepository appointmentRepository)
            => _appointmentRepository = appointmentRepository;

        public async Task<PagedData<AppointmentListItemResponse>> Handle(
            Query.GetOwnerAppointmentsQuery request, CancellationToken cancellationToken)
        {
            var items = await _appointmentRepository.GetByOwnerAsync(
                request.OwnerUserId, request.Page, request.PageSize);

            var total = await _appointmentRepository.CountByOwnerAsync(request.OwnerUserId);

            return new PagedData<AppointmentListItemResponse>
            {
                Items = items.Select(d => new AppointmentListItemResponse
                {
                    AppointmentId = d.Id,
                    PetId = d.PetId,
                    VetClinicId = d.VetClinicId,
                    AppointmentDate = d.AppointmentDate,
                    StartTime = d.StartTime,
                    EndTime = d.EndTime,
                    AppointmentType = d.AppointmentType.ToString(),
                    Status = d.Status.ToString(),
                    IsWalkIn = d.IsWalkIn,
                    CreatedAt = d.CreatedAt
                }).ToList(),
                Meta = new PaginationMeta<AppointmentListItemResponse>
                {
                    PageNumber = request.Page,
                    PageSize = request.PageSize,
                    TotalRecords = total
                }
            };
        }
    }
}
