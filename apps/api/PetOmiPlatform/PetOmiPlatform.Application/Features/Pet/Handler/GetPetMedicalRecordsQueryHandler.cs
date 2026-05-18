using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Domain.Entities;
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
        private readonly IPetUserAccessRepository _accessRepository;

        public GetPetMedicalRecordsQueryHandler(
            IPetRepository petRepository,
            IPetMedicalRecordRepository medicalRecordRepository,
            IPetUserAccessRepository accessRepository)
        {
            _petRepository = petRepository;
            _medicalRecordRepository = medicalRecordRepository;
            _accessRepository = accessRepository;
        }

        public async Task<List<PetMedicalRecordResponse>> Handle(GetPetMedicalRecordsQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanRead(pet, query.UserId);

            List<PetMedicalRecordDomain> medicalRecords;
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
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            }).ToList();
        }

        private async Task EnsureCanRead(PetDomain pet, Guid userId)
        {
            if (pet.OwnerUserId == userId) return;
            var access = await _accessRepository.GetByPetAndUserAsync(pet.Id, userId);
            if (access == null || !access.CanRead())
                throw new ForbiddenException("Bạn không có quyền xem thông tin này.");
        }
    }
}
