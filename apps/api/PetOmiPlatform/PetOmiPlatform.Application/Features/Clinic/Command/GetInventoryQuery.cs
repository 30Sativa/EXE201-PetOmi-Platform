using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record GetInventoryQuery(Guid ClinicId) : IRequest<IEnumerable<InventoryItemResponse>>;
}
