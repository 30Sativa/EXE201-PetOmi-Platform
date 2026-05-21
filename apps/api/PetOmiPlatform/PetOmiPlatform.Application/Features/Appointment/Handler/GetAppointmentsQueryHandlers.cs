using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class GetClinicAppointmentsQueryHandler
        : IRequestHandler<GetClinicAppointmentsQuery, PagedData<AppointmentListItemResponse>>
    {
        private readonly IAppointmentRepository _appointmentRepository;

        public GetClinicAppointmentsQueryHandler(IAppointmentRepository appointmentRepository)
        {
            _appointmentRepository = appointmentRepository;
        }

        public async Task<PagedData<AppointmentListItemResponse>> Handle(
            GetClinicAppointmentsQuery request, CancellationToken cancellationToken)
        {
            var items = await _appointmentRepository.GetByClinicAsync(
                request.ClinicId, request.Status, request.Date, request.Page, request.PageSize);

            var total = await _appointmentRepository.CountByClinicAsync(
                request.ClinicId, request.Status, request.Date);

            var dtos = items.Select(AppointmentHandlerHelper.ToListItem).ToList();

            return new PagedData<AppointmentListItemResponse>
            {
                Items = dtos,
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
        : IRequestHandler<GetOwnerAppointmentsQuery, PagedData<AppointmentListItemResponse>>
    {
        private readonly IAppointmentRepository _appointmentRepository;

        public GetOwnerAppointmentsQueryHandler(IAppointmentRepository appointmentRepository)
        {
            _appointmentRepository = appointmentRepository;
        }

        public async Task<PagedData<AppointmentListItemResponse>> Handle(
            GetOwnerAppointmentsQuery request, CancellationToken cancellationToken)
        {
            var items = await _appointmentRepository.GetByOwnerAsync(
                request.OwnerUserId, request.Page, request.PageSize);

            var total = await _appointmentRepository.CountByOwnerAsync(request.OwnerUserId);

            var dtos = items.Select(AppointmentHandlerHelper.ToListItem).ToList();

            return new PagedData<AppointmentListItemResponse>
            {
                Items = dtos,
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
