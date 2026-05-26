using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class GetPetMedicalRecordsQueryHandler : IRequestHandler<GetPetMedicalRecordsQuery, List<PetMedicalRecordResponse>>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetMedicalRecordRepository _medicalRecordRepository;
        private readonly IPetAccessService _accessService;

        public GetPetMedicalRecordsQueryHandler(
            IPetRepository petRepository,
            IPetMedicalRecordRepository medicalRecordRepository,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _medicalRecordRepository = medicalRecordRepository;
            _accessService = accessService;
        }

        public async Task<List<PetMedicalRecordResponse>> Handle(GetPetMedicalRecordsQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanReadAsync(pet, query.UserId, cancellationToken);

            List<Domain.Entities.PetMedicalRecordDomain> medicalRecords;
            if (!string.IsNullOrEmpty(query.RecordType))
            {
                medicalRecords = await _medicalRecordRepository.GetByPetIdAndTypeAsync(query.PetId, query.RecordType);
            }
            else
            {
                medicalRecords = await _medicalRecordRepository.GetByPetIdAsync(query.PetId);
            }

            return medicalRecords.Select(m => new PetMedicalRecordResponse
            {
                MedicalRecordId = m.Id,
                PetId = m.PetId,
                RecordType = m.RecordType,
                Title = m.Title,
                Description = m.Description,
                RecordDate = m.RecordDate,
                VetName = m.VetName,
                ClinicName = m.ClinicName,
                MedicationName = m.MedicationName,
                Dosage = m.Dosage,
                StartDate = m.StartDate,
                EndDate = m.EndDate,
                AttachmentUrl = m.AttachmentUrl,
                AttachmentCloudinaryPublicId = m.AttachmentCloudinaryPublicId,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            }).ToList();
        }
    }
}
