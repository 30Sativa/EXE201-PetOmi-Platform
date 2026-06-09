using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Request;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Query
{
    public record ResolvePetHealthShareQuery(
        Guid RequestUserId,
        Guid ClinicId,
        ResolvePetHealthShareRequest Request,
        string? IpAddress,
        string? UserAgent) : IRequest<PetHealthShareResolvedResponse>, INonTransactionalRequest;
}
