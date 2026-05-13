using FluentValidation;
using PetOmiPlatform.Application.Features.Vet.Command;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Vet.Validation
{
    public class CreateVetProfileCommandValidator : AbstractValidator<CreateVetProfileCommand>
    {
        public CreateVetProfileCommandValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống");

            RuleFor(x => x.Request.LicenseNumber)
                .MaximumLength(100).WithMessage("Số giấy phép không được vượt quá 100 ký tự")
                .When(x => x.Request.LicenseNumber != null);

            RuleFor(x => x.Request.Specialization)
                .MaximumLength(255).WithMessage("Chuyên khoa không được vượt quá 255 ký tự")
                .When(x => x.Request.Specialization != null);
        }
    }
}
