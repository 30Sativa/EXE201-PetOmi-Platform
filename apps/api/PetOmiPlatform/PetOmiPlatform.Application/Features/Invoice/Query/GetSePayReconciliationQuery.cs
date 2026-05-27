using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Query
{
    public record GetSePayReconciliationQuery(
        Guid ClinicId,
        Guid StaffUserId,
        int Limit = 50,
        bool IncludeMatched = false,
        int AlertAfterMinutes = 30
    ) : IRequest<IReadOnlyList<SePayReconciliationItemResponse>>;
}
