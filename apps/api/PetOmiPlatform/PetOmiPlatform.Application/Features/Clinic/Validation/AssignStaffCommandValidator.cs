using FluentValidation;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Domain.Common.Constants;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Clinic.Validation
{
    public class AssignStaffCommandValidator : AbstractValidator<AssignStaffCommand>
    {
        private static readonly string[] ValidRoles =
    [
        ClinicRoleConstants.PrimaryVet,
        ClinicRoleConstants.Assistant
    ];

        public AssignStaffCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("ClinicId không được để trống");

            RuleFor(x => x.Request.VetProfileId)
                .NotEmpty().WithMessage("VetProfileId không được để trống");

            RuleFor(x => x.Request.Role)
                .NotEmpty().WithMessage("Role không được để trống")
                .Must(r => ValidRoles.Contains(r))
                .WithMessage("Role chỉ được là 'PrimaryVet' hoặc 'Assistant'");
        }
    }
}
