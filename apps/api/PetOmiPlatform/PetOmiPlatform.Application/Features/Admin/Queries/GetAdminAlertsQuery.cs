using MediatR;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Admin.Queries;

public record GetAdminAlertsQuery(int MaxItems = 50) : IRequest<AdminAlertsResponse>;
