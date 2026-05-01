using FluentValidation;
using PetOmiPlatform.Application.Features.Auth.Command;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Validation
{
    public class LoginCommandValidator : AbstractValidator<LoginCommand>
    {
        public LoginCommandValidator()
        {
            RuleFor(x => x.Request.Email)
                .NotEmpty().WithMessage("Email không được để trống")
                .EmailAddress().WithMessage("Email không hợp lệ");

            RuleFor(x => x.Request.Password)
                .NotEmpty().WithMessage("Password không được để trống")
                .MinimumLength(6).WithMessage("Password phải ít nhất 6 ký tự");
        }
    }
}
