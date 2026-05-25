using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class CreatePetMedicalRecordCommandHandler : IRequestHandler<CreatePetMedicalRecordCommand, PetMedicalRecordResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetMedicalRecordRepository _medicalRecordRepository;
        private readonly IReminderRepository _reminderRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;
        private readonly IReminderAutoCreator _reminderAutoCreator;

        public CreatePetMedicalRecordCommandHandler(
            IPetRepository petRepository,
            IPetMedicalRecordRepository medicalRecordRepository,
            IReminderRepository reminderRepository,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService,
            IReminderAutoCreator reminderAutoCreator)
        {
            _petRepository = petRepository;
            _medicalRecordRepository = medicalRecordRepository;
            _reminderRepository = reminderRepository;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
            _reminderAutoCreator = reminderAutoCreator;
        }

        public async Task<PetMedicalRecordResponse> Handle(CreatePetMedicalRecordCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            var medicalRecord = Domain.Entities.PetMedicalRecordDomain.Create(
                petId: command.PetId,
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
                attachmentUrl: command.Request.AttachmentUrl,
                attachmentCloudinaryPublicId: command.Request.AttachmentCloudinaryPublicId
            );

            await _medicalRecordRepository.AddAsync(medicalRecord);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var reminders = await _reminderAutoCreator.CreateRemindersFromMedicalRecordAsync(
                medicalRecord,
                pet.OwnerUserId,
                pet.Name,
                cancellationToken);

            if (reminders.Count > 0)
            {
                await _reminderRepository.AddRangeAsync(reminders);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

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
                AttachmentCloudinaryPublicId = medicalRecord.AttachmentCloudinaryPublicId,
                CreatedAt = medicalRecord.CreatedAt,
                UpdatedAt = medicalRecord.UpdatedAt
            };
        }
    }
}
