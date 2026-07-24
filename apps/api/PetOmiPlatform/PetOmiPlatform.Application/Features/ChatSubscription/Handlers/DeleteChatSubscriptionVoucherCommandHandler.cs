using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.ChatSubscription.Commands;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class DeleteChatSubscriptionVoucherCommandHandler
    : IRequestHandler<DeleteChatSubscriptionVoucherCommand>
{
    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteChatSubscriptionVoucherCommandHandler(
        IChatSubscriptionRepository subscriptionRepository,
        IUnitOfWork unitOfWork)
    {
        _subscriptionRepository = subscriptionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteChatSubscriptionVoucherCommand command, CancellationToken cancellationToken)
    {
        var voucher = await _subscriptionRepository.GetVoucherByIdAsync(command.VoucherId)
            ?? throw new NotFoundException("Voucher", command.VoucherId);

        if (await _subscriptionRepository.HasPaymentsForVoucherAsync(voucher.Id))
        {
            throw new ConflictException("Voucher da co giao dich, chi co the tat de luu lich su thanh toan.");
        }

        await _subscriptionRepository.DeleteVoucherAsync(voucher.Id);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
