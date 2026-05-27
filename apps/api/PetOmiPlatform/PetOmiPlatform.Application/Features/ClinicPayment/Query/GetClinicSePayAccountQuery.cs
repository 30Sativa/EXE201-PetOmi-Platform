using MediatR;
using PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.ClinicPayment.Query
{
    public record GetClinicSePayAccountQuery(
        Guid ClinicId,
        Guid StaffUserId
    ) : IRequest<ClinicSePayAccountResponse?>;
}
