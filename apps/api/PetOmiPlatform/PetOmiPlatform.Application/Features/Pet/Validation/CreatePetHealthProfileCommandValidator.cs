using FluentValidation;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Pet.Validation
{
    public class CreatePetHealthProfileCommandValidator : AbstractValidator<CreatePetHealthProfileRequest>
    {
        public CreatePetHealthProfileCommandValidator()
        {
            RuleFor(x => x.CurrentWeightKg)
                .GreaterThan(0).When(x => x.CurrentWeightKg.HasValue)
                .WithMessage("Cân nặng phải lớn hơn 0.");

            RuleFor(x => x.IsNeutered)
                .Must(x => x == null || new[] { "Yes", "No", "Unknown" }.Contains(x, StringComparer.OrdinalIgnoreCase))
                .WithMessage("IsNeutered chỉ chấp nhận: Yes, No, Unknown.");
        }
    }
}
