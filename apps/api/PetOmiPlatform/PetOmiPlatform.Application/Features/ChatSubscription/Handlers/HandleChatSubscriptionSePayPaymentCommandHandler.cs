using System.Text.RegularExpressions;
using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.Commands;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class HandleChatSubscriptionSePayPaymentCommandHandler
    : IRequestHandler<HandleChatSubscriptionSePayPaymentCommand, bool>
{
    private static readonly Regex ReferenceCandidateRegex = new(
        @"[A-Za-z]{2,10}\d{6,8}",
        RegexOptions.Compiled);

    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly ISePayService _sePayService;
    private readonly IUnitOfWork _unitOfWork;

    public HandleChatSubscriptionSePayPaymentCommandHandler(
        IChatSubscriptionRepository subscriptionRepository,
        ISePayService sePayService,
        IUnitOfWork unitOfWork)
    {
        _subscriptionRepository = subscriptionRepository;
        _sePayService = sePayService;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(
        HandleChatSubscriptionSePayPaymentCommand request,
        CancellationToken cancellationToken)
    {
        var providerTransactionId = request.Payload.Id.ToString();
        if (await _subscriptionRepository.AnyProviderTransactionAsync(PaymentProvider.SePay, providerTransactionId))
        {
            return true;
        }

        var payment = await FindPaymentAsync(request.Payload.Code, request.Payload.ReferenceCode, request.Payload.Content);
        if (payment == null)
        {
            return false;
        }

        var now = DateTime.UtcNow;
        if (!string.Equals(request.Payload.TransferType, "in", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var platformAccount = _sePayService.GetPlatformPaymentAccount();
        if (platformAccount != null &&
            !string.Equals(platformAccount.BankAccountNo, request.Payload.AccountNumber, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!payment.CanBePaid(now))
        {
            payment.MarkExpired(now);
            await _subscriptionRepository.UpdatePaymentAsync(payment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }

        if (request.Payload.TransferAmount < payment.Amount)
        {
            return true;
        }

        var plan = await _subscriptionRepository.GetPlanByIdAsync(payment.PlanId);
        if (plan == null || plan.IsFree)
        {
            return true;
        }

        var subscription = await _subscriptionRepository.GetLatestOwnerPetSubscriptionAsync(
            payment.OwnerUserId,
            payment.PetId);

        if (subscription != null && subscription.IsUsableAt(now))
        {
            subscription.Renew(plan.Id, now, plan.BillingCycleDays);
            await _subscriptionRepository.UpdateSubscriptionAsync(subscription);
        }
        else
        {
            subscription = ChatSubscriptionDomain.CreateOwnerPet(
                ownerUserId: payment.OwnerUserId,
                petId: payment.PetId,
                planId: plan.Id,
                startsAtUtc: now,
                billingCycleDays: plan.BillingCycleDays);
            await _subscriptionRepository.AddSubscriptionAsync(subscription);
        }

        payment.MarkPaid(subscription.Id, providerTransactionId, now, request.RawPayload);
        await _subscriptionRepository.UpdatePaymentAsync(payment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    private async Task<ChatSubscriptionPaymentDomain?> FindPaymentAsync(
        string? code,
        string? referenceCode,
        string content)
    {
        foreach (var candidate in ExtractReferenceCandidates(code, referenceCode, content))
        {
            if (!_sePayService.IsValidPaymentReference(candidate))
                continue;

            var payment = await _subscriptionRepository.GetPaymentByReferenceAsync(candidate);
            if (payment != null)
            {
                return payment;
            }
        }

        return null;
    }

    private static IEnumerable<string> ExtractReferenceCandidates(
        string? code,
        string? referenceCode,
        string content)
    {
        var candidates = new List<string>();
        AddCandidate(candidates, code);
        AddCandidate(candidates, referenceCode);

        foreach (Match match in ReferenceCandidateRegex.Matches(content ?? string.Empty))
        {
            AddCandidate(candidates, match.Value);
        }

        return candidates.Distinct(StringComparer.OrdinalIgnoreCase);
    }

    private static void AddCandidate(List<string> candidates, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        candidates.Add(value.Trim().ToUpperInvariant());
    }
}
