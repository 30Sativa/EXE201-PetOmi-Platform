using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
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
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeletePetWeightLogCommandHandler(
            IPetRepository petRepository,
            IPetWeightLogRepository weightLogRepository,
            IPetUserAccessRepository accessRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _weightLogRepository = weightLogRepository;
            _accessRepository = accessRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task Handle(DeletePetWeightLogCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanWrite(pet, command.UserId);

            var weightLog = await _weightLogRepository.GetByIdAsync(command.WeightLogId)
                ?? throw new NotFoundException("Không tìm thấy bản ghi cân nặng.");

            if (weightLog.PetId != command.PetId)
                throw new NotFoundException("Bản ghi cân nặng không thuộc về thú cưng này.");

            await _weightLogRepository.DeleteAsync(command.WeightLogId);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        private async Task EnsureCanWrite(PetDomain pet, Guid userId)
        {
            if (pet.OwnerUserId == userId) return;
            var access = await _accessRepository.GetByPetAndUserAsync(pet.Id, userId);
            if (access == null || !access.CanWrite())
                throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này.");
        }
    }
}
