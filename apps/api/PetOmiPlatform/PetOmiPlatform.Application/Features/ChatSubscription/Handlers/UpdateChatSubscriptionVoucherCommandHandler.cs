using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.ChatSubscription.Commands;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Mappers;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class UpdateChatSubscriptionVoucherCommandHandler
    : IRequestHandler<UpdateChatSubscriptionVoucherCommand, ChatSubscriptionVoucherResponse>
{
    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateChatSubscriptionVoucherCommandHandler(
        IChatSubscriptionRepository subscriptionRepository,
        IUnitOfWork unitOfWork)
    {
        _subscriptionRepository = subscriptionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ChatSubscriptionVoucherResponse> Handle(
        UpdateChatSubscriptionVoucherCommand command,
        CancellationToken cancellationToken)
    {
        var voucher = await _subscriptionRepository.GetVoucherByIdAsync(command.VoucherId)
            ?? throw new NotFoundException("Voucher", command.VoucherId);

        if (await _subscriptionRepository.AnyVoucherCodeAsync(command.Request.Code, command.VoucherId))
            throw new ConflictException("Ma voucher da ton tai.");

        voucher.Update(
            code: command.Request.Code,
            name: command.Request.Name,
            description: command.Request.Description,
            discountType: CreateChatSubscriptionVoucherCommandHandler.ParseDiscountType(command.Request.DiscountType),
            discountValue: command.Request.DiscountValue,
            maxDiscountAmount: command.Request.MaxDiscountAmount,
            minOrderAmount: command.Request.MinOrderAmount,
            usageLimit: command.Request.UsageLimit,
            startsAt: command.Request.StartsAt,
            expiresAt: command.Request.ExpiresAt,
            isActive: command.Request.IsActive,
            utcNow: DateTime.UtcNow);

        await _subscriptionRepository.UpdateVoucherAsync(voucher);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return voucher.ToResponse();
    }
}
