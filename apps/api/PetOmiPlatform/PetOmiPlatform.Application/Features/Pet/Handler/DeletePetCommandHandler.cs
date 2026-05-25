using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class DeletePetCommandHandler : IRequestHandler<DeletePetCommand>
    {
        private readonly IPetRepository _petRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public DeletePetCommandHandler(
            IPetRepository petRepository,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task Handle(DeletePetCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureOwnerAsync(pet, command.UserId, cancellationToken);

            pet.SoftDelete();
            await _petRepository.UpdateAsync(pet);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
