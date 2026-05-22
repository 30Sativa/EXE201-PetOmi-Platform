using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    /// <summary>
    /// Mỗi record = 1 thuốc trong đơn kê của bác sĩ.
    /// Thuộc về MedicalExamination, không tồn tại độc lập.
    /// </summary>
    public class PrescriptionDomain : BaseEntity
    {
        public Guid ExaminationId { get; private set; }
        public string MedicationName { get; private set; } = string.Empty;
        public string Dosage { get; private set; } = string.Empty;       // "5mg", "1 viên"
        public string Frequency { get; private set; } = string.Empty;    // "2 lần/ngày"
        public int DurationDays { get; private set; }
        public string? Instructions { get; private set; }                 // "uống sau ăn"
        public Guid? InventoryItemId { get; private set; }               // link kho (optional)
        public DateTime CreatedAt { get; private set; }

        private PrescriptionDomain() { }

        public static PrescriptionDomain Create(
            Guid examinationId,
            string medicationName,
            string dosage,
            string frequency,
            int durationDays,
            string? instructions = null,
            Guid? inventoryItemId = null)
        {
            if (string.IsNullOrWhiteSpace(medicationName))
                throw new DomainException("Tên thuốc không được để trống.");
            if (string.IsNullOrWhiteSpace(dosage))
                throw new DomainException("Liều dùng không được để trống.");
            if (string.IsNullOrWhiteSpace(frequency))
                throw new DomainException("Tần suất dùng không được để trống.");
            if (durationDays <= 0)
                throw new DomainException("Số ngày dùng phải lớn hơn 0.");

            return new PrescriptionDomain
            {
                Id = Guid.NewGuid(),
                ExaminationId = examinationId,
                MedicationName = medicationName.Trim(),
                Dosage = dosage.Trim(),
                Frequency = frequency.Trim(),
                DurationDays = durationDays,
                Instructions = instructions?.Trim(),
                InventoryItemId = inventoryItemId,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static PrescriptionDomain Reconstitute(
            Guid id, Guid examinationId,
            string medicationName, string dosage, string frequency,
            int durationDays, string? instructions, Guid? inventoryItemId,
            DateTime createdAt)
        {
            return new PrescriptionDomain
            {
                Id = id,
                ExaminationId = examinationId,
                MedicationName = medicationName,
                Dosage = dosage,
                Frequency = frequency,
                DurationDays = durationDays,
                Instructions = instructions,
                InventoryItemId = inventoryItemId,
                CreatedAt = createdAt
            };
        }

        public void Update(
            string? medicationName = null,
            string? dosage = null,
            string? frequency = null,
            int? durationDays = null,
            string? instructions = null,
            Guid? inventoryItemId = null)
        {
            if (medicationName is not null)
            {
                if (string.IsNullOrWhiteSpace(medicationName))
                    throw new DomainException("Tên thuốc không được để trống.");
                MedicationName = medicationName.Trim();
            }
            if (dosage is not null)
            {
                if (string.IsNullOrWhiteSpace(dosage))
                    throw new DomainException("Liều dùng không được để trống.");
                Dosage = dosage.Trim();
            }
            if (frequency is not null)
            {
                if (string.IsNullOrWhiteSpace(frequency))
                    throw new DomainException("Tần suất không được để trống.");
                Frequency = frequency.Trim();
            }
            if (durationDays.HasValue)
            {
                if (durationDays.Value <= 0)
                    throw new DomainException("Số ngày dùng phải lớn hơn 0.");
                DurationDays = durationDays.Value;
            }
            if (instructions is not null) Instructions = instructions.Trim();
            if (inventoryItemId.HasValue) InventoryItemId = inventoryItemId;
        }
    }
}
