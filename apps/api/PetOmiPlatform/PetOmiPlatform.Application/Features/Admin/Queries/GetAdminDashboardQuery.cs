using MediatR;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Admin.Queries;

public record GetAdminDashboardQuery : IRequest<AdminDashboardResponse>;
