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

        var pet = await _petRepository.GetByIdAsync(command.Request.PetId)
            ?? throw new NotFoundException("Pet", command.Request.PetId);
        pet.EnsureActive();
        pet.EnsureOwner(command.OwnerUserId);

        var platformAccount = _sePayService.GetPlatformPaymentAccount();
        if (platformAccount == null)
        {
            throw new ConflictException("Chua cau hinh tai khoan SePay platform cho subscription chat.");
        }

        // Early-bird: giam % cho user trong nhung chu ky thanh toan dau (neu setting bat).
        var promo = await _promotionSettings.GetAsync(cancellationToken);
        var originalAmount = plan.PriceMonthly;
        var discountPercent = 0;

        if (promo.EarlyBirdEnabled && promo.EarlyBirdDiscountPercent > 0)
        {
            var paidCount = await _subscriptionRepository.CountPaidPaymentsAsync(command.OwnerUserId);
            if (paidCount < promo.EarlyBirdCycles)
            {
                discountPercent = Math.Min(promo.EarlyBirdDiscountPercent, 100);
            }
        }

        var finalAmount = discountPercent > 0
            ? Math.Round(originalAmount * (100 - discountPercent) / 100m, 0)
            : originalAmount;

        var paymentReference = await GenerateUniquePaymentReferenceAsync();
        var qrCodeUrl = _sePayService.BuildQrImageUrl(
            platformAccount.BankAccountNo,
            platformAccount.BankCode,
            finalAmount,
            paymentReference);

        var payment = ChatSubscriptionPaymentDomain.CreatePending(
            planId: plan.Id,
            ownerUserId: command.OwnerUserId,
            petId: pet.Id,
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
            PetId = pet.Id,
            PetName = pet.Name,
            PlanCode = plan.Code,
            PlanName = plan.Name,
            Status = payment.Status.ToString(),
            Amount = payment.Amount,
            OriginalAmount = originalAmount,
            DiscountPercent = discountPercent,
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
