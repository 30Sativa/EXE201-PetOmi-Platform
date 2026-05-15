using FluentValidation;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Domain.Common.Constants;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Validation
{
    public class ToggleRoleCommandValidator : AbstractValidator<ToggleRoleCommand>
    {
        private static readonly string[] ValidRoles = [RoleConstants.Owner, RoleConstants.Vet];

        public ToggleRoleCommandValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống");

            RuleFor(x => x.TargetRole)
                .NotEmpty().WithMessage("TargetRole không được để trống")
                .Must(r => ValidRoles.Contains(r))
                .WithMessage("TargetRole chỉ được là 'Owner' hoặc 'Vet'");

            // ClinicId bắt buộc khi toggle sang Vet
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("ClinicId bắt buộc khi toggle sang Vet")
                .When(x => x.TargetRole == RoleConstants.Vet);
        }
    }
}
