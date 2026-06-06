using FluentValidation;
using PetOmiPlatform.Application.Features.PetHealthShare.Command;
using PetOmiPlatform.Domain.Common.Enums;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Validation
{
    public class CreatePetHealthShareCommandValidator : AbstractValidator<CreatePetHealthShareCommand>
    {
        public CreatePetHealthShareCommandValidator()
        {
            RuleFor(x => x.PetId)
                .NotEmpty().WithMessage("PetId is required.");

            RuleFor(x => x.Request.Scope)
                .NotEmpty().WithMessage("Scope is required.")
                .Must(scope => Enum.TryParse<PetHealthShareScope>(scope, true, out _))
                .WithMessage("Scope must be EmergencySummary, ClinicVisit, or FullHealthProfile.");

            RuleFor(x => x.Request.AccessMode)
                .NotEmpty().WithMessage("AccessMode is required.")
                .Must(mode => Enum.TryParse<PetHealthShareAccessMode>(mode, true, out _))
                .WithMessage("AccessMode must be Temporary or OneTime.");

            RuleFor(x => x.Request.ExpiresAt)
                .GreaterThan(DateTime.UtcNow).When(x => x.Request.ExpiresAt.HasValue)
                .WithMessage("ExpiresAt must be in the future.");

            RuleFor(x => x.Request.ExpiresAt)
                .LessThanOrEqualTo(DateTime.UtcNow.AddDays(7)).When(x => x.Request.ExpiresAt.HasValue)
                .WithMessage("ExpiresAt cannot be more than 7 days from now for MVP.");

            RuleFor(x => x.Request.MaxUses)
                .GreaterThan(0).When(x => x.Request.MaxUses.HasValue)
                .WithMessage("MaxUses must be greater than 0.");

            RuleFor(x => x.Request.MaxUses)
                .LessThanOrEqualTo(100).When(x => x.Request.MaxUses.HasValue)
                .WithMessage("MaxUses cannot exceed 100.");

            RuleFor(x => x.Request.Note)
                .MaximumLength(500).When(x => !string.IsNullOrWhiteSpace(x.Request.Note))
                .WithMessage("Note cannot exceed 500 characters.");
        }
    }
}
