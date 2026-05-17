using FluentValidation;
using PetOmiPlatform.Application.Features.Pet.Command;

namespace PetOmiPlatform.Application.Features.Pet.Validation
{
    public class UpdatePetCommandValidator : AbstractValidator<UpdatePetCommand>
    {
        private static readonly string[] ValidSpecies = { "Dog", "Cat" };
        private static readonly string[] ValidGenders = { "Male", "Female", "Unknown" };
        private static readonly string[] ValidNeuteredValues = { "Yes", "No", "Unknown" };

        public UpdatePetCommandValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống.");

            RuleFor(x => x.PetId)
                .NotEmpty().WithMessage("PetId không được để trống.");

            RuleFor(x => x.Request.Name)
                .NotEmpty().WithMessage("Tên thú cưng không được để trống.")
                .MaximumLength(100).WithMessage("Tên thú cưng không được vượt quá 100 ký tự.");

            RuleFor(x => x.Request.Species)
                .NotEmpty().WithMessage("Loài không được để trống.")
                .Must(s => ValidSpecies.Contains(s))
                .WithMessage("Loài không hợp lệ. Chỉ hỗ trợ: Dog, Cat.");

            RuleFor(x => x.Request.Breed)
                .MaximumLength(100).WithMessage("Giống không được vượt quá 100 ký tự.")
                .When(x => x.Request.Breed != null);

            RuleFor(x => x.Request.Gender)
                .Must(g => ValidGenders.Contains(g))
                .WithMessage("Giới tính không hợp lệ. Chỉ chấp nhận: Male, Female, Unknown.")
                .When(x => x.Request.Gender != null);

            RuleFor(x => x.Request.IsNeutered)
                .Must(n => ValidNeuteredValues.Contains(n))
                .WithMessage("Giá trị triệt sản không hợp lệ. Chỉ chấp nhận: Yes, No, Unknown.")
                .When(x => x.Request.IsNeutered != null);

            RuleFor(x => x.Request.AvatarUrl)
                .MaximumLength(500).WithMessage("URL ảnh đại diện không được vượt quá 500 ký tự.")
                .When(x => x.Request.AvatarUrl != null);

            RuleFor(x => x.Request.Color)
                .MaximumLength(200).WithMessage("Màu lông không được vượt quá 200 ký tự.")
                .When(x => x.Request.Color != null);
        }
    }
}
