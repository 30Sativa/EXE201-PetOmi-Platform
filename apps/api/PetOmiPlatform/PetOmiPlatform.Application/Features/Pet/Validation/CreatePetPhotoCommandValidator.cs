using FluentValidation;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Pet.Validation
{
    public class CreatePetPhotoCommandValidator : AbstractValidator<CreatePetPhotoRequest>
    {
        public CreatePetPhotoCommandValidator()
        {
            RuleFor(x => x.ImageUrl)
                .NotEmpty().WithMessage("URL ảnh không được để trống.")
                .MaximumLength(500).WithMessage("URL ảnh tối đa 500 ký tự.");

            RuleFor(x => x.Caption)
                .MaximumLength(255).When(x => !string.IsNullOrEmpty(x.Caption))
                .WithMessage("Caption tối đa 255 ký tự.");
        }
    }
}
