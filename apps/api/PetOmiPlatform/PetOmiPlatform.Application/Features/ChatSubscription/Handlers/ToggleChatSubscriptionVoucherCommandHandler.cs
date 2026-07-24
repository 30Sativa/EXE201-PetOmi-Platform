using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.ChatSubscription.Commands;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Mappers;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class ToggleChatSubscriptionVoucherCommandHandler
    : IRequestHandler<ToggleChatSubscriptionVoucherCommand, ChatSubscriptionVoucherResponse>
{
    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ToggleChatSubscriptionVoucherCommandHandler(
        IChatSubscriptionRepository subscriptionRepository,
        IUnitOfWork unitOfWork)
    {
        _subscriptionRepository = subscriptionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ChatSubscriptionVoucherResponse> Handle(
        ToggleChatSubscriptionVoucherCommand command,
        CancellationToken cancellationToken)
    {
        var voucher = await _subscriptionRepository.GetVoucherByIdAsync(command.VoucherId)
            ?? throw new NotFoundException("Voucher", command.VoucherId);

        voucher.SetActive(command.IsActive, DateTime.UtcNow);
        await _subscriptionRepository.UpdateVoucherAsync(voucher);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return voucher.ToResponse();
    }
}
