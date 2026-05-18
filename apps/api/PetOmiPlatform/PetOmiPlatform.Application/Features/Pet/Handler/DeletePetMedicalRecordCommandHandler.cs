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
    public class DeletePetMedicalRecordCommandHandler : IRequestHandler<DeletePetMedicalRecordCommand>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetMedicalRecordRepository _medicalRecordRepository;
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeletePetMedicalRecordCommandHandler(
            IPetRepository petRepository,
            IPetMedicalRecordRepository medicalRecordRepository,
            IPetUserAccessRepository accessRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _medicalRecordRepository = medicalRecordRepository;
            _accessRepository = accessRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task Handle(DeletePetMedicalRecordCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanWrite(pet, command.UserId);

            var medicalRecord = await _medicalRecordRepository.GetByIdAsync(command.MedicalRecordId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ y tế.");

            if (medicalRecord.PetId != command.PetId)
                throw new NotFoundException("Hồ sơ y tế không thuộc về thú cưng này.");

            await _medicalRecordRepository.DeleteAsync(command.MedicalRecordId);
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
