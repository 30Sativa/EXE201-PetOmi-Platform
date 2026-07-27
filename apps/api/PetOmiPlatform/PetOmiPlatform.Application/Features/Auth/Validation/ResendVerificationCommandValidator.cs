using FluentValidation;
using PetOmiPlatform.Application.Features.Auth.Command;

namespace PetOmiPlatform.Application.Features.Auth.Validation
{
    public class ResendVerificationCommandValidator : AbstractValidator<ResendVerificationCommand>
    {
        public ResendVerificationCommandValidator()
        {
            RuleFor(x => x.Request.Email)
                .NotEmpty().WithMessage("Email không được để trống")
                .EmailAddress().WithMessage("Email không hợp lệ");
        }
    }
}
