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
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPromotionSettingsService _promotionSettings;

    public CreateChatSubscriptionPaymentCommandHandler(
        IChatSubscriptionRepository subscriptionRepository,
        IInvoiceRepository invoiceRepository,
        IPetRepository petRepository,
        ISePayService sePayService,
        IUnitOfWork unitOfWork,
        IPromotionSettingsService promotionSettings)
    {
        _subscriptionRepository = subscriptionRepository;
        _invoiceRepository = invoiceRepository;
        _petRepository = petRepository;
        _sePayService = sePayService;
        _unitOfWork = unitOfWork;
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

            if (!voucher.CanApply(originalAmount, DateTime.UtcNow))
                throw new ConflictException("Voucher khong kha dung hoac da het han.");

            var amountAfterEarlyBird = originalAmount - discountAmount;
            var voucherDiscount = voucher.CalculateDiscount(amountAfterEarlyBird);
            if (voucherDiscount <= 0)
                throw new ConflictException("Voucher khong the ap dung cho goi nay.");

            discountAmount += voucherDiscount;
        }

        var finalAmount = originalAmount - discountAmount;
        if (finalAmount <= 0)
            throw new ConflictException("Voucher khong the giam het phi thanh toan SePay.");

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
            expiresAtUtc: DateTime.UtcNow.AddMinutes(30));

        await _subscriptionRepository.AddPaymentAsync(payment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ChatSubscriptionPaymentResponse
        {
            PaymentId = payment.Id,
            PetId = pet?.Id,
            PetName = pet?.Name,
            PlanCode = plan.Code,
            PlanName = plan.Name,
            Status = payment.Status.ToString(),
            Amount = payment.Amount,
            OriginalAmount = originalAmount,
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
            ExpiresAt = payment.ExpiresAt,
            PaidAt = payment.PaidAt,
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
