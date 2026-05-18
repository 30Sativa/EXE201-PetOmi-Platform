using FluentValidation;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Pet.Validation
{
    public class CreatePetWeightLogCommandValidator : AbstractValidator<CreatePetWeightLogRequest>
    {
        public CreatePetWeightLogCommandValidator()
        {
            RuleFor(x => x.WeightKg)
                .GreaterThan(0)
                .WithMessage("Cân nặng phải lớn hơn 0.");

            RuleFor(x => x.MeasuredAt)
                .NotEmpty()
                .WithMessage("Thời điểm đo cân không được để trống.")
                .LessThanOrEqualTo(DateTime.UtcNow)
                .WithMessage("Thời điểm đo cân không thể trong tương lai.");

            RuleFor(x => x.Source)
                .MaximumLength(50).When(x => !string.IsNullOrEmpty(x.Source))
                .WithMessage("Nguồn nhập tối đa 50 ký tự.");

            RuleFor(x => x.Note)
                .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Note))
                .WithMessage("Ghi chú tối đa 500 ký tự.");
        }
    }
}
