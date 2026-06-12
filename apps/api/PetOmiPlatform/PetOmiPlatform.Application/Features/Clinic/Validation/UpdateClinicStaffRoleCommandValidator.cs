using FluentValidation;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Domain.Common.Constants;

namespace PetOmiPlatform.Application.Features.Clinic.Validation
{
    public class UpdateClinicStaffRoleCommandValidator : AbstractValidator<UpdateClinicStaffRoleCommand>
    {
        private static readonly string[] ValidRoles =
        [
            ClinicRoleConstants.PrimaryVet,
            ClinicRoleConstants.Assistant,
            ClinicRoleConstants.Cashier
        ];

        public UpdateClinicStaffRoleCommandValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("ClinicId không được để trống.");

            RuleFor(x => x.VetClinicId)
                .NotEmpty().WithMessage("VetClinicId không được để trống.");

            RuleFor(x => x.Request.Role)
                .NotEmpty().WithMessage("Role không được để trống.")
                .Must(r => ValidRoles.Contains(r))
                .WithMessage("Role chỉ được là 'PrimaryVet', 'Assistant' hoặc 'Cashier'.");
        }
    }
}
