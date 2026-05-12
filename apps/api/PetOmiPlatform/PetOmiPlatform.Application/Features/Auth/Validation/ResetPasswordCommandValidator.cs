using FluentValidation;
using PetOmiPlatform.Application.Features.Auth.Command;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Validation
{
    public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
    {
        public ResetPasswordCommandValidator()
        {
            RuleFor(x => x.Request.Token)
                .NotEmpty().WithMessage("Token không được để trống");

            RuleFor(x => x.Request.NewPassword)
                .NotEmpty().WithMessage("Mật khẩu không được để trống")
                .MinimumLength(6).WithMessage("Mật khẩu phải ít nhất 6 ký tự");

            RuleFor(x => x.Request.ConfirmPassword)
                .Equal(x => x.Request.NewPassword)
                .WithMessage("Mật khẩu xác nhận không khớp");
        }
    }
}
