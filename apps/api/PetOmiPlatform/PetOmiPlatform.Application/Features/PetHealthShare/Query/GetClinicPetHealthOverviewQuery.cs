using MediatR;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Query
{
    public record GetClinicPetHealthOverviewQuery(
        Guid RequestUserId,
        Guid ClinicId,
        Guid PetId,
        string? ShareCode) : IRequest<PetHealthOverviewResponse>;
}
