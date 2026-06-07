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
                .NotEmpty().WithMessage("ClinicId khong duoc de trong.");

            RuleFor(x => x.VetClinicId)
                .NotEmpty().WithMessage("VetClinicId khong duoc de trong.");

            RuleFor(x => x.Request.Role)
                .NotEmpty().WithMessage("Role khong duoc de trong.")
                .Must(r => ValidRoles.Contains(r))
                .WithMessage("Role chi duoc la 'PrimaryVet', 'Assistant' hoac 'Cashier'.");
        }
    }
}
