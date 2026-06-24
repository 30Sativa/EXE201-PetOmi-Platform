using MediatR;
using PetOmiPlatform.Application.Features.Promotions.DTOs;

namespace PetOmiPlatform.Application.Features.Promotions.Queries;

public record GetPromotionOffersQuery(Guid UserId) : IRequest<PromotionOffersResponse>;

public record GetReferralInfoQuery(Guid UserId) : IRequest<ReferralInfoResponse>;
