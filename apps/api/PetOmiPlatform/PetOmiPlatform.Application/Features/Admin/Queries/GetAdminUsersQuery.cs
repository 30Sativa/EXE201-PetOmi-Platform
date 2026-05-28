using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Admin.Queries;

public record GetAdminUsersQuery(
    string? Search,
    bool? IsActive,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedData<AdminUserListResponse>>;
