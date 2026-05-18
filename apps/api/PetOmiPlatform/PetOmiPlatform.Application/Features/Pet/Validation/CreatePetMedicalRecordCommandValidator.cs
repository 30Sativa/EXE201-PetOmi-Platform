using FluentValidation;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Pet.Validation
{
    public class CreatePetMedicalRecordCommandValidator : AbstractValidator<CreatePetMedicalRecordRequest>
    {
        private static readonly string[] ValidRecordTypes = { "Vaccine", "Visit", "Medication", "Surgery", "Allergy", "Illness" };

        public CreatePetMedicalRecordCommandValidator()
        {
            RuleFor(x => x.RecordType)
                .NotEmpty().WithMessage("Loại hồ sơ không được để trống.")
                .Must(x => ValidRecordTypes.Contains(x, StringComparer.OrdinalIgnoreCase))
                .WithMessage($"RecordType chỉ chấp nhận: {string.Join(", ", ValidRecordTypes)}.");

            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Tiêu đề không được để trống.")
                .MaximumLength(200).WithMessage("Tiêu đề tối đa 200 ký tự.");

            RuleFor(x => x.RecordDate)
                .NotEmpty().WithMessage("Ngày ghi nhận không được để trống.");

            RuleFor(x => x)
                .Must(x => !x.StartDate.HasValue || !x.EndDate.HasValue || x.StartDate <= x.EndDate)
                .WithMessage("Ngày bắt đầu không thể sau ngày kết thúc.");

            RuleFor(x => x.VetName)
                .MaximumLength(200).When(x => !string.IsNullOrEmpty(x.VetName))
                .WithMessage("Tên bác sĩ tối đa 200 ký tự.");

            RuleFor(x => x.ClinicName)
                .MaximumLength(200).When(x => !string.IsNullOrEmpty(x.ClinicName))
                .WithMessage("Tên phòng khám tối đa 200 ký tự.");

            RuleFor(x => x.MedicationName)
                .MaximumLength(200).When(x => !string.IsNullOrEmpty(x.MedicationName))
                .WithMessage("Tên thuốc tối đa 200 ký tự.");

            RuleFor(x => x.Dosage)
                .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.Dosage))
                .WithMessage("Liều dùng tối đa 100 ký tự.");
        }
    }
}
