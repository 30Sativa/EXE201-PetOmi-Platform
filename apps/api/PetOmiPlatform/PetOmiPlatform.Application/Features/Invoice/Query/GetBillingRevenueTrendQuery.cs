using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Query
{
    public record GetBillingRevenueTrendQuery(
        Guid ClinicId,
        Guid StaffUserId,
        DateOnly FromDate,
        DateOnly ToDate
    ) : IRequest<BillingRevenueTrendResponse>;
}
