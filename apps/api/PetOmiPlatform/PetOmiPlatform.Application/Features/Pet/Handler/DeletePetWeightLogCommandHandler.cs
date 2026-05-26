using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class DeletePetWeightLogCommandHandler : IRequestHandler<DeletePetWeightLogCommand>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetWeightLogRepository _weightLogRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public DeletePetWeightLogCommandHandler(
            IPetRepository petRepository,
            IPetWeightLogRepository weightLogRepository,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _weightLogRepository = weightLogRepository;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task Handle(DeletePetWeightLogCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            var weightLog = await _weightLogRepository.GetByIdAsync(command.WeightLogId)
                ?? throw new NotFoundException("Không tìm thấy bản ghi cân nặng.");

            if (weightLog.PetId != command.PetId)
                throw new NotFoundException("Bản ghi cân nặng không thuộc về thú cưng này.");

            await _weightLogRepository.DeleteAsync(command.WeightLogId);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
