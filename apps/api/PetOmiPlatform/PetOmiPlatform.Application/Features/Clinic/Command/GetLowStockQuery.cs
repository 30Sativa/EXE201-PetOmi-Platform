using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    /// <summary>Lấy danh sách thuốc/vật tư sắp hết tồn kho (Quantity ≤ LowStockThreshold).</summary>
    public record GetLowStockQuery(Guid RequestUserId, Guid ClinicId) : IRequest<IEnumerable<InventoryItemResponse>>;
}
