using FluentValidation;
using PetOmiPlatform.Application.Features.Auth.Command;

namespace PetOmiPlatform.Application.Features.Auth.Validation
{
    public class SetPasswordCommandValidator : AbstractValidator<SetPasswordCommand>
    {
        public SetPasswordCommandValidator()
        {
            RuleFor(x => x.Request.NewPassword)
                .NotEmpty().WithMessage("Mật khẩu không được để trống")
                .MinimumLength(6).WithMessage("Mật khẩu phải ít nhất 6 ký tự");

            RuleFor(x => x.Request.ConfirmPassword)
                .Equal(x => x.Request.NewPassword)
                .WithMessage("Mật khẩu xác nhận không khớp");
        }
    }
}
