using FluentValidation;
using PetOmiPlatform.Application.Features.UserProfile.Command;
using System;

namespace PetOmiPlatform.Application.Features.UserProfile.Validation
{
    public class CompleteUserProfileValidator : AbstractValidator<CompleteUserProfileCommand>
    {
        public CompleteUserProfileValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống");

            RuleFor(x => x.Request.FullName)
                .NotEmpty().WithMessage("Họ tên không được để trống")
                .MaximumLength(100).WithMessage("Họ tên tối đa 100 ký tự");

            RuleFor(x => x.Request.Phone)
                .NotEmpty().WithMessage("Số điện thoại không được để trống")
                .Matches(@"^\+?[0-9]{9,15}$")
                .WithMessage("Số điện thoại không hợp lệ");

            RuleFor(x => x.Request.Gender)
                .NotEmpty().WithMessage("Giới tính không được để trống")
                .Must(g => g == "Male" || g == "Female" || g == "Other")
                .WithMessage("Giới tính phải là Male, Female hoặc Other");

            RuleFor(x => x.Request.Address)
                .MaximumLength(500).WithMessage("Địa chỉ tối đa 500 ký tự");
        }
    }
}
