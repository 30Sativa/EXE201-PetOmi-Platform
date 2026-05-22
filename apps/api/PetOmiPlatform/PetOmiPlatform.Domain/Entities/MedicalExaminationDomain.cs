using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    /// <summary>
    /// Phiếu khám do bác sĩ tạo — theo chuẩn SOAP Note (Subjective/Objective/Assessment/Plan).
    /// Tách biệt với PetMedicalRecords (owner tự nhập).
    /// </summary>
    public class MedicalExaminationDomain : BaseEntity
    {
        // --- Identity ---
        public Guid AppointmentId { get; private set; }
        public Guid PetId { get; private set; }
        public Guid? VetClinicId { get; private set; }    // bác sĩ thực hiện

        // --- SOAP: S — Subjective (chủ quan - lý do đến) ---
        public string ChiefComplaint { get; private set; } = string.Empty;

        // --- SOAP: O — Objective (khách quan - chỉ số sinh tồn) ---
        public decimal? WeightKg { get; private set; }
        public decimal? TemperatureC { get; private set; }
        public int? HeartRate { get; private set; }           // bpm
        public int? RespiratoryRate { get; private set; }     // lần/phút
        public string? ExaminationNotes { get; private set; } // nhận xét lâm sàng

        // --- SOAP: A — Assessment (chẩn đoán) ---
        public string? Diagnosis { get; private set; }

        // --- SOAP: P — Plan (kế hoạch) ---
        public string? TreatmentPlan { get; private set; }

        // --- State ---
        public ExaminationStatus Status { get; private set; }

        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }
        public DateTime? CompletedAt { get; private set; }

        private MedicalExaminationDomain() { }

        // --- Factory ---
        public static MedicalExaminationDomain Create(
            Guid appointmentId,
            Guid petId,
            string chiefComplaint,
            Guid? vetClinicId = null,
            decimal? weightKg = null,
            decimal? temperatureC = null,
            int? heartRate = null,
            int? respiratoryRate = null,
            string? examinationNotes = null,
            string? diagnosis = null,
            string? treatmentPlan = null)
        {
            if (string.IsNullOrWhiteSpace(chiefComplaint))
                throw new DomainException("Lý do khám không được để trống.");

            return new MedicalExaminationDomain
            {
                Id = Guid.NewGuid(),
                AppointmentId = appointmentId,
                PetId = petId,
                VetClinicId = vetClinicId,
                ChiefComplaint = chiefComplaint.Trim(),
                WeightKg = weightKg,
                TemperatureC = temperatureC,
                HeartRate = heartRate,
                RespiratoryRate = respiratoryRate,
                ExaminationNotes = examinationNotes,
                Diagnosis = diagnosis,
                TreatmentPlan = treatmentPlan,
                Status = ExaminationStatus.InProgress,
                CreatedAt = DateTime.UtcNow
            };
        }

        // --- Reconstitute (EF rehydration) ---
        public static MedicalExaminationDomain Reconstitute(
            Guid id, Guid appointmentId, Guid petId, Guid? vetClinicId,
            string chiefComplaint,
            decimal? weightKg, decimal? temperatureC, int? heartRate, int? respiratoryRate,
            string? examinationNotes, string? diagnosis, string? treatmentPlan,
            ExaminationStatus status,
            DateTime createdAt, DateTime? updatedAt, DateTime? completedAt)
        {
            return new MedicalExaminationDomain
            {
                Id = id,
                AppointmentId = appointmentId,
                PetId = petId,
                VetClinicId = vetClinicId,
                ChiefComplaint = chiefComplaint,
                WeightKg = weightKg,
                TemperatureC = temperatureC,
                HeartRate = heartRate,
                RespiratoryRate = respiratoryRate,
                ExaminationNotes = examinationNotes,
                Diagnosis = diagnosis,
                TreatmentPlan = treatmentPlan,
                Status = status,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt,
                CompletedAt = completedAt
            };
        }

        // --- Behaviors ---

        /// <summary>Cập nhật thông tin phiếu khám trong khi đang khám.</summary>
        public void Update(
            string? chiefComplaint = null,
            decimal? weightKg = null,
            decimal? temperatureC = null,
            int? heartRate = null,
            int? respiratoryRate = null,
            string? examinationNotes = null,
            string? diagnosis = null,
            string? treatmentPlan = null)
        {
            if (Status == ExaminationStatus.Completed)
                throw new DomainException("Không thể cập nhật phiếu khám đã hoàn thành.");

            if (chiefComplaint is not null)
            {
                if (string.IsNullOrWhiteSpace(chiefComplaint))
                    throw new DomainException("Lý do khám không được để trống.");
                ChiefComplaint = chiefComplaint.Trim();
            }

            if (weightKg.HasValue) WeightKg = weightKg;
            if (temperatureC.HasValue) TemperatureC = temperatureC;
            if (heartRate.HasValue) HeartRate = heartRate;
            if (respiratoryRate.HasValue) RespiratoryRate = respiratoryRate;
            if (examinationNotes is not null) ExaminationNotes = examinationNotes;
            if (diagnosis is not null) Diagnosis = diagnosis;
            if (treatmentPlan is not null) TreatmentPlan = treatmentPlan;

            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Bác sĩ hoàn thành phiếu khám (InProgress → Completed).</summary>
        public void Complete()
        {
            if (Status != ExaminationStatus.InProgress)
                throw new DomainException("Phiếu khám đã hoàn thành rồi.");

            if (string.IsNullOrWhiteSpace(Diagnosis))
                throw new DomainException("Phải có chẩn đoán trước khi hoàn thành phiếu khám.");

            Status = ExaminationStatus.Completed;
            CompletedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
