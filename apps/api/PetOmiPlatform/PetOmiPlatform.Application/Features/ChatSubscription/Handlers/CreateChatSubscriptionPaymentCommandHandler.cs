using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.ChatSubscription.Commands;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class CreateChatSubscriptionPaymentCommandHandler
    : IRequestHandler<CreateChatSubscriptionPaymentCommand, ChatSubscriptionPaymentResponse>
{
    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IPetRepository _petRepository;
    private readonly ISePayService _sePayService;
    private readonly IPromotionSettingsService _promotionSettings;

    public CreateChatSubscriptionPaymentCommandHandler(
        IChatSubscriptionRepository subscriptionRepository,
        IInvoiceRepository invoiceRepository,
        IPetRepository petRepository,
        ISePayService sePayService,
        IPromotionSettingsService promotionSettings)
    {
        _subscriptionRepository = subscriptionRepository;
        _invoiceRepository = invoiceRepository;
        _petRepository = petRepository;
        _sePayService = sePayService;
        _promotionSettings = promotionSettings;
    }

    public async Task<ChatSubscriptionPaymentResponse> Handle(
        CreateChatSubscriptionPaymentCommand command,
        CancellationToken cancellationToken)
    {
        var plan = await _subscriptionRepository.GetPlanByCodeAsync(command.Request.PlanCode)
            ?? throw new NotFoundException("Khong tim thay goi chat AI.");

        if (plan.IsFree || plan.PriceMonthly <= 0)
            throw new ConflictException("Goi Free khong can tao thanh toan.");

        PetOmiPlatform.Domain.Entities.PetDomain? pet = null;
        if (command.Request.PetId.HasValue)
        {
            pet = await _petRepository.GetByIdAsync(command.Request.PetId.Value)
                ?? throw new NotFoundException("Pet", command.Request.PetId.Value);
            pet.EnsureActive();
            pet.EnsureOwner(command.OwnerUserId);
        }

        var platformAccount = _sePayService.GetPlatformPaymentAccount();
        if (platformAccount == null)
        {
            throw new ConflictException("Chua cau hinh tai khoan SePay platform cho subscription chat.");
        }

        var now = DateTime.UtcNow;
        await _subscriptionRepository.ExpirePendingPaymentsForOwnerAsync(command.OwnerUserId, now);

        // Early-bird: giam % cho user trong nhung chu ky thanh toan dau (neu setting bat).
        var promo = await _promotionSettings.GetAsync(cancellationToken);
        var originalAmount = plan.PriceMonthly;
        var discountPercent = 0;
        var discountAmount = 0m;
        ChatSubscriptionVoucherDomain? voucher = null;

        if (promo.EarlyBirdEnabled && promo.EarlyBirdDiscountPercent > 0)
        {
            var paidCount = await _subscriptionRepository.CountPaidPaymentsAsync(command.OwnerUserId);
            if (paidCount < promo.EarlyBirdCycles)
            {
                discountPercent = Math.Min(promo.EarlyBirdDiscountPercent, 90);
                discountAmount = Math.Round(originalAmount * discountPercent / 100m, 0);
            }
        }

        if (!string.IsNullOrWhiteSpace(command.Request.VoucherCode))
        {
            voucher = await _subscriptionRepository.GetVoucherByCodeAsync(command.Request.VoucherCode)
                ?? throw new NotFoundException("Khong tim thay voucher.");

            if (!voucher.CanApply(originalAmount, now))
                throw new ConflictException("Voucher khong kha dung hoac da het han.");

            var voucherDiscount = voucher.CalculateDiscount(originalAmount);
            if (voucherDiscount <= 0)
                throw new ConflictException("Voucher khong the ap dung cho goi nay.");

            discountAmount = Math.Min(originalAmount, discountAmount + voucherDiscount);
        }

        var finalAmount = Math.Max(0m, originalAmount - discountAmount);

        var openPayment = await _subscriptionRepository.GetOpenPaymentByOwnerAsync(command.OwnerUserId, now);
        if (openPayment != null)
        {
            if (MatchesCheckout(
                    openPayment,
                    plan,
                    pet,
                    platformAccount.BankAccountNo,
                    platformAccount.BankCode,
                    originalAmount,
                    discountAmount,
                    finalAmount,
                    voucher?.Code))
            {
                return await BuildResponseAsync(openPayment, plan, pet, discountPercent);
            }

            if (!await _subscriptionRepository.TryCancelOpenPaymentAsync(openPayment.Id, now))
            {
                var concurrentOpenPayment = await _subscriptionRepository.GetOpenPaymentByOwnerAsync(
                    command.OwnerUserId,
                    now);

                if (concurrentOpenPayment != null && MatchesCheckout(
                        concurrentOpenPayment,
                        plan,
                        pet,
                        platformAccount.BankAccountNo,
                        platformAccount.BankCode,
                        originalAmount,
                        discountAmount,
                        finalAmount,
                        voucher?.Code))
                {
                    return await BuildResponseAsync(concurrentOpenPayment, plan, pet, discountPercent);
                }

                throw new ConflictException("Thong tin thanh toan vua thay doi. Vui long thu lai.");
            }
        }

        if (voucher != null && !await _subscriptionRepository.TryReserveVoucherAsync(voucher.Id, now))
        {
            throw new ConflictException("Voucher da het luot dung hoac khong con kha dung.");
        }

        if (finalAmount == 0)
        {
            return await CompleteComplimentaryPaymentAsync(
                plan,
                pet,
                voucher!,
                originalAmount,
                discountAmount,
                discountPercent,
                command.OwnerUserId,
                now);
        }

        var paymentReference = await GenerateUniquePaymentReferenceAsync();
        var qrCodeUrl = _sePayService.BuildQrImageUrl(
            platformAccount.BankAccountNo,
            platformAccount.BankCode,
            finalAmount,
            paymentReference);

        var payment = ChatSubscriptionPaymentDomain.CreatePending(
            planId: plan.Id,
            ownerUserId: command.OwnerUserId,
            petId: pet?.Id,
            originalAmount: originalAmount,
            discountAmount: discountAmount,
            voucherId: voucher?.Id,
            voucherCode: voucher?.Code,
            amount: finalAmount,
            paymentReference: paymentReference,
            qrCodeUrl: qrCodeUrl,
            bankAccountNo: platformAccount.BankAccountNo,
            bankCode: platformAccount.BankCode,
            expiresAtUtc: now.AddMinutes(30),
            hasVoucherReservation: voucher != null);

        if (!await _subscriptionRepository.TryAddOpenPaymentAsync(payment, cancellationToken))
        {
            if (payment.VoucherId.HasValue && payment.ReleaseVoucherReservation(now))
            {
                await _subscriptionRepository.ReleaseVoucherReservationAsync(payment.VoucherId.Value, now);
            }

            var concurrentOpenPayment = await _subscriptionRepository.GetOpenPaymentByOwnerAsync(command.OwnerUserId, now);
            if (concurrentOpenPayment != null)
            {
                return await BuildResponseAsync(concurrentOpenPayment, plan, pet, 0);
            }

            throw new ConflictException("Khong the tao QR thanh toan. Vui long thu lai.");
        }

        return await BuildResponseAsync(payment, plan, pet, discountPercent);
    }

    private static bool MatchesCheckout(
        ChatSubscriptionPaymentDomain payment,
        ChatSubscriptionPlanDomain plan,
        PetOmiPlatform.Domain.Entities.PetDomain? pet,
        string bankAccountNo,
        string bankCode,
        decimal originalAmount,
        decimal discountAmount,
        decimal finalAmount,
        string? voucherCode)
    {
        return payment.PlanId == plan.Id
            && payment.PetId == pet?.Id
            && payment.OriginalAmount == originalAmount
            && payment.DiscountAmount == discountAmount
            && payment.Amount == finalAmount
            && string.Equals(
                NormalizeVoucherCode(payment.VoucherCode),
                NormalizeVoucherCode(voucherCode),
                StringComparison.Ordinal)
            && string.Equals(payment.BankAccountNo.Trim(), bankAccountNo.Trim(), StringComparison.Ordinal)
            && string.Equals(payment.BankCode.Trim(), bankCode.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private static string? NormalizeVoucherCode(string? voucherCode)
    {
        return string.IsNullOrWhiteSpace(voucherCode)
            ? null
            : voucherCode.Trim().Replace(" ", string.Empty).ToUpperInvariant();
    }

    private async Task<ChatSubscriptionPaymentResponse> CompleteComplimentaryPaymentAsync(
        ChatSubscriptionPlanDomain plan,
        PetOmiPlatform.Domain.Entities.PetDomain? pet,
        ChatSubscriptionVoucherDomain voucher,
        decimal originalAmount,
        decimal discountAmount,
        int discountPercent,
        Guid ownerUserId,
        DateTime now)
    {
        var subscription = await _subscriptionRepository.GetLatestOwnerSubscriptionAsync(ownerUserId);
        if (subscription != null)
        {
            subscription.Renew(plan.Id, now, plan.BillingCycleDays);
            await _subscriptionRepository.UpdateSubscriptionAsync(subscription);
        }
        else
        {
            subscription = ChatSubscriptionDomain.CreateOwnerAccount(
                ownerUserId: ownerUserId,
                planId: plan.Id,
                startsAtUtc: now,
                billingCycleDays: plan.BillingCycleDays);
            await _subscriptionRepository.AddSubscriptionAsync(subscription);
        }

        var payment = ChatSubscriptionPaymentDomain.CreateComplimentaryPaid(
            subscriptionId: subscription.Id,
            planId: plan.Id,
            ownerUserId: ownerUserId,
            petId: pet?.Id,
            originalAmount: originalAmount,
            discountAmount: discountAmount,
            voucherId: voucher.Id,
            voucherCode: voucher.Code,
            paymentReference: await GenerateUniquePaymentReferenceAsync(),
            paidAtUtc: now);

        await _subscriptionRepository.AddPaymentAsync(payment);
        await _subscriptionRepository.CompleteVoucherReservationAsync(voucher.Id, hadReservation: true, now);

        return await BuildResponseAsync(payment, plan, pet, discountPercent);
    }

    private async Task<ChatSubscriptionPaymentResponse> BuildResponseAsync(
        ChatSubscriptionPaymentDomain payment,
        ChatSubscriptionPlanDomain requestedPlan,
        PetOmiPlatform.Domain.Entities.PetDomain? requestedPet,
        int discountPercent)
    {
        var plan = payment.PlanId == requestedPlan.Id
            ? requestedPlan
            : await _subscriptionRepository.GetPlanByIdAsync(payment.PlanId)
                ?? throw new NotFoundException("Khong tim thay goi chat AI.");

        var pet = payment.PetId == requestedPet?.Id
            ? requestedPet
            : payment.PetId.HasValue
                ? await _petRepository.GetByIdAsync(payment.PetId.Value)
                : null;

        return new ChatSubscriptionPaymentResponse
        {
            PaymentId = payment.Id,
            PetId = pet?.Id,
            PetName = pet?.Name,
            PlanCode = plan.Code,
            PlanName = plan.Name,
            Status = payment.Status.ToString(),
            Amount = payment.Amount,
            OriginalAmount = payment.OriginalAmount,
            DiscountPercent = discountPercent,
            DiscountAmount = payment.DiscountAmount,
            VoucherCode = payment.VoucherCode,
            DiscountLabel = BuildDiscountLabel(discountPercent, payment.VoucherCode),
            Currency = payment.Currency,
            Provider = payment.Provider.ToString(),
            PaymentReference = payment.PaymentReference,
            QrCodeUrl = payment.QrCodeUrl,
            BankAccountNo = payment.BankAccountNo,
            BankCode = payment.BankCode,
            // SQL Server datetime does not preserve DateTimeKind. Always expose
            // payment timestamps as UTC so browser countdowns parse them correctly.
            ExpiresAt = ChatSubscriptionUtcDateTime.Normalize(payment.ExpiresAt),
            PaidAt = ChatSubscriptionUtcDateTime.Normalize(payment.PaidAt),
            SubscriptionId = payment.SubscriptionId
        };
    }

    private static string? BuildDiscountLabel(int earlyBirdDiscountPercent, string? voucherCode)
    {
        var labels = new List<string>();
        if (earlyBirdDiscountPercent > 0)
            labels.Add($"Early-bird {earlyBirdDiscountPercent}%");
        if (!string.IsNullOrWhiteSpace(voucherCode))
            labels.Add($"Voucher {voucherCode}");

        return labels.Count == 0 ? null : string.Join(" + ", labels);
    }

    private async Task<string> GenerateUniquePaymentReferenceAsync()
    {
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var reference = _sePayService.GeneratePaymentReference();
            var subscriptionExists = await _subscriptionRepository.AnyPaymentReferenceAsync(reference);
            if (subscriptionExists)
                continue;

            var invoiceExists = await _invoiceRepository.GetByPaymentReferenceAsync(reference);
            if (invoiceExists == null)
            {
                return reference;
            }
        }

        throw new ConflictException("Khong the tao ma thanh toan subscription duy nhat. Vui long thu lai.");
    }
}
