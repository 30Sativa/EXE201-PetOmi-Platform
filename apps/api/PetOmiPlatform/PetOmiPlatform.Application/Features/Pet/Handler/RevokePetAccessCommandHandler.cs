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
    public class RevokePetAccessCommandHandler : IRequestHandler<RevokePetAccessCommand>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public RevokePetAccessCommandHandler(
            IPetRepository petRepository,
            IPetUserAccessRepository accessRepository,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _accessRepository = accessRepository;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task Handle(RevokePetAccessCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureOwnerAsync(pet, command.UserId, cancellationToken);

            var access = await _accessRepository.GetByIdAsync(command.AccessId)
                ?? throw new NotFoundException("Không tìm thấy quyền truy cập.");

            if (access.PetId != command.PetId)
                throw new NotFoundException("Quyền truy cập không thuộc về thú cưng này.");

            await _accessRepository.RevokeAsync(command.AccessId);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
