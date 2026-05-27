using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Query
{
    public record GetPendingManualRefundsQuery(
        Guid ClinicId,
        Guid StaffUserId,
        int Page,
        int PageSize
    ) : IRequest<IReadOnlyList<PendingManualRefundItemResponse>>;
}
