using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Query
{
    public record GetSePayPaymentStatusQuery(
        Guid ClinicId,
        Guid StaffUserId,
        Guid InvoiceId
    ) : IRequest<SePayPaymentStatusResponse>;
}
