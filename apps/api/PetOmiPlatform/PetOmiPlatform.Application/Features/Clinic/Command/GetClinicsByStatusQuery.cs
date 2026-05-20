using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    /// <summary>Admin query — lấy danh sách clinic theo status (mặc định Pending), có phân trang.</summary>
    public record GetClinicsByStatusQuery(string Status, int Page, int PageSize)
        : IRequest<PagedData<ClinicListItemResponse>>;
}
