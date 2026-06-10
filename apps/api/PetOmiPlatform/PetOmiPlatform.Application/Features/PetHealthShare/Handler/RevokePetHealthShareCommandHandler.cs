using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.PetHealthShare.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Handler
{
    public class RevokePetHealthShareCommandHandler : IRequestHandler<RevokePetHealthShareCommand, bool>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetHealthShareTokenRepository _shareTokenRepository;
        private readonly IPetAccessService _accessService;
        private readonly IUnitOfWork _unitOfWork;

        public RevokePetHealthShareCommandHandler(
            IPetRepository petRepository,
            IPetHealthShareTokenRepository shareTokenRepository,
            IPetAccessService accessService,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _shareTokenRepository = shareTokenRepository;
            _accessService = accessService;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(
            RevokePetHealthShareCommand command,
            CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureOwnerAsync(pet, command.RequestUserId, cancellationToken);

            var shareToken = await _shareTokenRepository.GetByIdAsync(command.ShareTokenId)
                ?? throw new NotFoundException("PetHealthShareToken", command.ShareTokenId);

            if (shareToken.PetId != command.PetId)
                throw new ValidationException("ShareTokenId", "Mã chia sẻ không thuộc hồ sơ thú cưng này.");

            shareToken.Revoke(DateTime.UtcNow);
            await _shareTokenRepository.UpdateAsync(shareToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
