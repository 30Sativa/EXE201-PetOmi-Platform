using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class PetMedicalRecordDomain : BaseEntity
    {
        public Guid PetId { get; private set; }
        public string RecordType { get; private set; }
        public string Title { get; private set; }
        public string? Description { get; private set; }
        public DateOnly RecordDate { get; private set; }
        public string? VetName { get; private set; }
        public string? ClinicName { get; private set; }
        public string? MedicationName { get; private set; }
        public string? Dosage { get; private set; }
        public DateOnly? StartDate { get; private set; }
        public DateOnly? EndDate { get; private set; }
        public string? AttachmentUrl { get; private set; }
        public string? AttachmentCloudinaryPublicId { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }
        public DateTime? DeletedAt { get; private set; }
        public bool IsActive { get; private set; }

        private static readonly string[] ValidRecordTypes = { "Vaccine", "Visit", "Medication", "Surgery", "Allergy", "Illness" };

        private PetMedicalRecordDomain() { }

        private PetMedicalRecordDomain(
            Guid petId,
            string recordType,
            string title,
            string? description,
            DateOnly recordDate,
            string? vetName,
            string? clinicName,
            string? medicationName,
            string? dosage,
            DateOnly? startDate,
            DateOnly? endDate,
            string? attachmentUrl,
            string? attachmentCloudinaryPublicId)
        {
            Id = Guid.NewGuid();
            PetId = petId;
            RecordType = recordType;
            Title = title;
            Description = description;
            RecordDate = recordDate;
            VetName = vetName;
            ClinicName = clinicName;
            MedicationName = medicationName;
            Dosage = dosage;
            StartDate = startDate;
            EndDate = endDate;
            AttachmentUrl = attachmentUrl;
            AttachmentCloudinaryPublicId = attachmentCloudinaryPublicId;
            CreatedAt = DateTime.UtcNow;
            IsActive = true;
        }

        public static PetMedicalRecordDomain Create(
            Guid petId,
            string recordType,
            string title,
            string? description,
            DateOnly recordDate,
            string? vetName,
            string? clinicName,
            string? medicationName,
            string? dosage,
            DateOnly? startDate,
            DateOnly? endDate,
            string? attachmentUrl,
            string? attachmentCloudinaryPublicId)
        {
            ValidateRecordType(recordType);
            ValidateDates(recordDate, startDate, endDate);
            return new PetMedicalRecordDomain(
                petId, recordType, title, description, recordDate,
                vetName, clinicName, medicationName, dosage,
                startDate, endDate, attachmentUrl, attachmentCloudinaryPublicId);
        }

        public static PetMedicalRecordDomain Reconstitute(
            Guid id,
            Guid petId,
            string recordType,
            string title,
            string? description,
            DateOnly recordDate,
            string? vetName,
            string? clinicName,
            string? medicationName,
            string? dosage,
            DateOnly? startDate,
            DateOnly? endDate,
            string? attachmentUrl,
            string? attachmentCloudinaryPublicId,
            DateTime createdAt,
            DateTime? updatedAt,
            DateTime? deletedAt,
            bool isActive)
        {
            return new PetMedicalRecordDomain
            {
                Id = id,
                PetId = petId,
                RecordType = recordType,
                Title = title,
                Description = description,
                RecordDate = recordDate,
                VetName = vetName,
                ClinicName = clinicName,
                MedicationName = medicationName,
                Dosage = dosage,
                StartDate = startDate,
                EndDate = endDate,
                AttachmentUrl = attachmentUrl,
                AttachmentCloudinaryPublicId = attachmentCloudinaryPublicId,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt,
                DeletedAt = deletedAt,
                IsActive = isActive
            };
        }

        public void UpdateInfo(
            string? recordType,
            string? title,
            string? description,
            DateOnly? recordDate,
            string? vetName,
            string? clinicName,
            string? medicationName,
            string? dosage,
            DateOnly? startDate,
            DateOnly? endDate,
            string? attachmentUrl,
            string? attachmentCloudinaryPublicId)
        {
            if (recordType != null) ValidateRecordType(recordType);
            if (recordDate != null && startDate != null && endDate != null)
                ValidateDates(recordDate.Value, startDate.Value, endDate.Value);
            if (recordType != null) RecordType = recordType;
            if (title != null) Title = title;
            if (description != null) Description = description;
            if (recordDate != null) RecordDate = recordDate.Value;
            if (vetName != null) VetName = vetName;
            if (clinicName != null) ClinicName = clinicName;
            if (medicationName != null) MedicationName = medicationName;
            if (dosage != null) Dosage = dosage;
            if (startDate != null) StartDate = startDate;
            if (endDate != null) EndDate = endDate;
            if (attachmentUrl != null) AttachmentUrl = attachmentUrl;
            if (attachmentCloudinaryPublicId != null) AttachmentCloudinaryPublicId = attachmentCloudinaryPublicId;
            UpdatedAt = DateTime.UtcNow;
        }

        public void SoftDelete()
        {
            if (!IsActive)
                throw new DomainException("Hồ sơ y tế này đã bị xóa trước đó.");
            IsActive = false;
            DeletedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        private static void ValidateRecordType(string recordType)
        {
            if (!Array.Exists(ValidRecordTypes, t => t.Equals(recordType, StringComparison.OrdinalIgnoreCase)))
                throw new DomainException($"RecordType không hợp lệ. Chỉ chấp nhận: {string.Join(", ", ValidRecordTypes)}.");
        }

        private static void ValidateDates(DateOnly recordDate, DateOnly? startDate, DateOnly? endDate)
        {
            if (startDate.HasValue && endDate.HasValue && startDate > endDate)
                throw new DomainException("Ngày bắt đầu không thể sau ngày kết thúc.");
        }
    }
}
