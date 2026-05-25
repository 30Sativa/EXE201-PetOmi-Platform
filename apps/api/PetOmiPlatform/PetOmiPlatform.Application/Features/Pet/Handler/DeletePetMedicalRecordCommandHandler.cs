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
    public class DeletePetMedicalRecordCommandHandler : IRequestHandler<DeletePetMedicalRecordCommand>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetMedicalRecordRepository _medicalRecordRepository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public DeletePetMedicalRecordCommandHandler(
            IPetRepository petRepository,
            IPetMedicalRecordRepository medicalRecordRepository,
            ICloudinaryService cloudinaryService,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _medicalRecordRepository = medicalRecordRepository;
            _cloudinaryService = cloudinaryService;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task Handle(DeletePetMedicalRecordCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            var medicalRecord = await _medicalRecordRepository.GetByIdAsync(command.MedicalRecordId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ y tế.");

            if (medicalRecord.PetId != command.PetId)
                throw new NotFoundException("Hồ sơ y tế không thuộc về thú cưng này.");

            var publicId = medicalRecord.AttachmentCloudinaryPublicId;

            await _medicalRecordRepository.DeleteAsync(command.MedicalRecordId);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(publicId))
            {
                await _cloudinaryService.DeleteAsync(publicId, cancellationToken);
            }
        }
    }
}
