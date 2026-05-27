using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Query
{
    public record GetInvoiceAgingQuery(
        Guid ClinicId,
        Guid StaffUserId,
        int Page = 1,
        int PageSize = 50,
        int MinAgeDays = 0
    ) : IRequest<IReadOnlyList<InvoiceAgingItemResponse>>;
}
