using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Queries;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class GetChatSubscriptionPaymentStatusQueryHandler
    : IRequestHandler<GetChatSubscriptionPaymentStatusQuery, ChatSubscriptionPaymentResponse>
{
    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly IPetRepository _petRepository;
    private readonly IUnitOfWork _unitOfWork;

    public GetChatSubscriptionPaymentStatusQueryHandler(
        IChatSubscriptionRepository subscriptionRepository,
        IPetRepository petRepository,
        IUnitOfWork unitOfWork)
    {
        _subscriptionRepository = subscriptionRepository;
        _petRepository = petRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ChatSubscriptionPaymentResponse> Handle(
        GetChatSubscriptionPaymentStatusQuery request,
        CancellationToken cancellationToken)
    {
        var payment = await _subscriptionRepository.GetPaymentByIdAsync(request.PaymentId)
            ?? throw new NotFoundException("Chat subscription payment", request.PaymentId);

        if (payment.OwnerUserId != request.OwnerUserId)
            throw new ForbiddenException("Khong co quyen xem thanh toan subscription nay.");

        var now = DateTime.UtcNow;
        payment.MarkExpired(now);
        await _subscriptionRepository.UpdatePaymentAsync(payment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var plan = await _subscriptionRepository.GetPlanByIdAsync(payment.PlanId)
            ?? throw new NotFoundException("Khong tim thay goi chat AI.");
        var pet = await _petRepository.GetByIdAsync(payment.PetId)
            ?? throw new NotFoundException("Pet", payment.PetId);

        return new ChatSubscriptionPaymentResponse
        {
            PaymentId = payment.Id,
            PetId = payment.PetId,
            PetName = pet.Name,
            PlanCode = plan.Code,
            PlanName = plan.Name,
            Status = payment.Status.ToString(),
            Amount = payment.Amount,
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
}
