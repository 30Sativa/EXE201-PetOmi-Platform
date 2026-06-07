using MediatR;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Query
{
    public record GetPetHealthSharesQuery(Guid UserId, Guid PetId) : IRequest<List<PetHealthShareResponse>>;
}
