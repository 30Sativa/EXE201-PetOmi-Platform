using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Query
{
    public record GetInvoiceByOrderQuery(
        Guid ClinicId,
        Guid StaffUserId,
        Guid OrderId
    ) : IRequest<InvoiceResponse?>;
}
