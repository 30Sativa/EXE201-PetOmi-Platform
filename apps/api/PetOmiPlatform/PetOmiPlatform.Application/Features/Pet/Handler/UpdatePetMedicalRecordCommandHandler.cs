using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class UpdatePetMedicalRecordCommandHandler : IRequestHandler<UpdatePetMedicalRecordCommand, PetMedicalRecordResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetMedicalRecordRepository _medicalRecordRepository;
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdatePetMedicalRecordCommandHandler(
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

        public async Task<PetMedicalRecordResponse> Handle(UpdatePetMedicalRecordCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanWrite(pet, command.UserId);

            var medicalRecord = await _medicalRecordRepository.GetByIdAsync(command.MedicalRecordId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ y tế.");

            if (medicalRecord.PetId != command.PetId)
                throw new NotFoundException("Hồ sơ y tế không thuộc về thú cưng này.");

            medicalRecord.UpdateInfo(
                recordType: command.Request.RecordType,
                title: command.Request.Title,
                description: command.Request.Description,
                recordDate: command.Request.RecordDate,
                vetName: command.Request.VetName,
                clinicName: command.Request.ClinicName,
                medicationName: command.Request.MedicationName,
                dosage: command.Request.Dosage,
                startDate: command.Request.StartDate,
                endDate: command.Request.EndDate,
                attachmentUrl: command.Request.AttachmentUrl
            );

            await _medicalRecordRepository.UpdateAsync(medicalRecord);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PetMedicalRecordResponse
            {
                MedicalRecordId = medicalRecord.Id,
                PetId = medicalRecord.PetId,
                RecordType = medicalRecord.RecordType,
                Title = medicalRecord.Title,
                Description = medicalRecord.Description,
                RecordDate = medicalRecord.RecordDate,
                VetName = medicalRecord.VetName,
                ClinicName = medicalRecord.ClinicName,
                MedicationName = medicalRecord.MedicationName,
                Dosage = medicalRecord.Dosage,
                StartDate = medicalRecord.StartDate,
                EndDate = medicalRecord.EndDate,
                AttachmentUrl = medicalRecord.AttachmentUrl,
                CreatedAt = medicalRecord.CreatedAt,
                UpdatedAt = medicalRecord.UpdatedAt
            };
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
