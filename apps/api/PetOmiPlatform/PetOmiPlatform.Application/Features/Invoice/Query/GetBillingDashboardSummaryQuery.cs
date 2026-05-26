using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Query
{
    public record GetBillingDashboardSummaryQuery(
        Guid ClinicId,
        Guid StaffUserId
    ) : IRequest<BillingDashboardSummaryResponse>;
}
