using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Query
{
    public record GetInvoiceByAppointmentQuery(
        Guid ClinicId,
        Guid StaffUserId,
        Guid AppointmentId
    ) : IRequest<InvoiceResponse?>;
}
