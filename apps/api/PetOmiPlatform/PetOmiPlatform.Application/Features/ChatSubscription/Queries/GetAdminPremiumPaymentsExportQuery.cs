using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Queries;

public record GetAdminPremiumPaymentsExportQuery(
    DateOnly? FromDate,
    DateOnly? ToDate) : IRequest<AdminPremiumPaymentsExportResponse>;
