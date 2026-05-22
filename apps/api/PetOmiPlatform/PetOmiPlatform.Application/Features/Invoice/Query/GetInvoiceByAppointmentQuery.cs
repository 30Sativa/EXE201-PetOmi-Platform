using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Query
{
    public record GetInvoiceByAppointmentQuery(
        Guid ClinicId,
        Guid AppointmentId
    ) : IRequest<InvoiceResponse?>;
}
