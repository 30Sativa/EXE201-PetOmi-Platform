using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Queries;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public sealed class GetAdminPremiumPaymentsExportQueryHandler
    : IRequestHandler<GetAdminPremiumPaymentsExportQuery, AdminPremiumPaymentsExportResponse>
{
    private static readonly TimeSpan VietnamUtcOffset = TimeSpan.FromHours(7);
    private readonly IChatSubscriptionRepository _subscriptionRepository;

    public GetAdminPremiumPaymentsExportQueryHandler(
        IChatSubscriptionRepository subscriptionRepository)
    {
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<AdminPremiumPaymentsExportResponse> Handle(
        GetAdminPremiumPaymentsExportQuery request,
        CancellationToken cancellationToken)
    {
        if (request.FromDate.HasValue &&
            request.ToDate.HasValue &&
            request.ToDate.Value < request.FromDate.Value)
        {
            throw new BadRequestException("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
        }

        var fromPaidAtUtc = request.FromDate.HasValue
            ? ToUtc(request.FromDate.Value)
            : (DateTime?)null;
        var toPaidAtExclusiveUtc = request.ToDate.HasValue
            ? ToUtc(request.ToDate.Value.AddDays(1))
            : (DateTime?)null;

        var payments = await _subscriptionRepository.GetAdminPaidPremiumPaymentsForExportAsync(
            fromPaidAtUtc,
            toPaidAtExclusiveUtc,
            cancellationToken);

        return new AdminPremiumPaymentsExportResponse
        {
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            GeneratedAtUtc = DateTime.UtcNow,
            Items = payments.Select(payment => new AdminPremiumPaymentExportItemResponse
            {
                OwnerUserId = payment.OwnerUserId,
                OwnerName = payment.OwnerName,
                OwnerEmail = payment.OwnerEmail,
                PlanName = payment.PlanName,
                OriginalAmount = payment.OriginalAmount,
                DiscountAmount = payment.DiscountAmount,
                Amount = payment.Amount,
                Currency = payment.Currency,
                VoucherCode = payment.VoucherCode,
                Provider = payment.Provider,
                PaymentReference = payment.PaymentReference,
                ProviderTransactionId = payment.ProviderTransactionId,
                PaidAt = payment.PaidAt,
                CurrentSubscriptionExpiresAt = payment.CurrentSubscriptionExpiresAt
            }).ToList()
        };
    }

    private static DateTime ToUtc(DateOnly vietnamDate)
    {
        var localMidnight = vietnamDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        return new DateTimeOffset(localMidnight, VietnamUtcOffset).UtcDateTime;
    }
}
