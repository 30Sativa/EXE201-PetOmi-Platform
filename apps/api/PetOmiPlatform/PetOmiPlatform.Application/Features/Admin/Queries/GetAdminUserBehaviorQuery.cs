using MediatR;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Admin.Queries;

public sealed record GetAdminUserBehaviorQuery(
    DateTime? FromDate,
    DateTime? ToDate,
    string? Origin) : IRequest<AdminUserBehaviorResponse>;
