using FluentValidation;
using PetOmiPlatform.Application.Features.UserProfile.Command;
using System;

namespace PetOmiPlatform.Application.Features.UserProfile.Validation
{
    public class CreateUserProfileValidator : AbstractValidator<CreateUserProfileCommand>
    {
        public CreateUserProfileValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống");

            RuleFor(x => x.Request.FullName)
                .MaximumLength(100).WithMessage("Họ tên tối đa 100 ký tự");

            RuleFor(x => x.Request.Phone)
                .Matches(@"^\+?[0-9]{9,15}$")
                .When(x => !string.IsNullOrWhiteSpace(x.Request.Phone))
                .WithMessage("Số điện thoại không hợp lệ");

            RuleFor(x => x.Request.Gender)
                .Must(g => string.IsNullOrEmpty(g) || g == "Male" || g == "Female" || g == "Other")
                .WithMessage("Giới tính phải là Male, Female hoặc Other");

            RuleFor(x => x.Request.AvatarUrl)
                .MaximumLength(500).WithMessage("Avatar URL tối đa 500 ký tự");

            RuleFor(x => x.Request.Address)
                .MaximumLength(500).WithMessage("Địa chỉ tối đa 500 ký tự");
        }
    }
}
