using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.ChatSubscription.Commands;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Mappers;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class CreateChatSubscriptionVoucherCommandHandler
    : IRequestHandler<CreateChatSubscriptionVoucherCommand, ChatSubscriptionVoucherResponse>
{
    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateChatSubscriptionVoucherCommandHandler(
        IChatSubscriptionRepository subscriptionRepository,
        IUnitOfWork unitOfWork)
    {
        _subscriptionRepository = subscriptionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ChatSubscriptionVoucherResponse> Handle(
        CreateChatSubscriptionVoucherCommand command,
        CancellationToken cancellationToken)
    {
        if (await _subscriptionRepository.AnyVoucherCodeAsync(command.Request.Code))
            throw new ConflictException("Ma voucher da ton tai.");

        var voucher = ChatSubscriptionVoucherDomain.Create(
            code: command.Request.Code,
            name: command.Request.Name,
            description: command.Request.Description,
            discountType: ParseDiscountType(command.Request.DiscountType),
            discountValue: command.Request.DiscountValue,
            maxDiscountAmount: command.Request.MaxDiscountAmount,
            minOrderAmount: command.Request.MinOrderAmount,
            usageLimit: command.Request.UsageLimit,
            startsAt: command.Request.StartsAt,
            expiresAt: command.Request.ExpiresAt,
            isActive: command.Request.IsActive,
            createdByAdminId: command.AdminUserId);

        await _subscriptionRepository.AddVoucherAsync(voucher);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return voucher.ToResponse();
    }

    internal static ChatSubscriptionVoucherDiscountType ParseDiscountType(string discountType)
    {
        if (Enum.TryParse<ChatSubscriptionVoucherDiscountType>(discountType, true, out var parsed))
            return parsed;

        throw new ConflictException("Loai giam gia voucher khong hop le.");
    }
}
