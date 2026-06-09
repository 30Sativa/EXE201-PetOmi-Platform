using FluentValidation;
using PetOmiPlatform.Application.Features.PetHealthShare.Query;
using System.Text.RegularExpressions;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Validation
{
    public class ResolvePetHealthShareQueryValidator : AbstractValidator<ResolvePetHealthShareQuery>
    {
        public ResolvePetHealthShareQueryValidator()
        {
            RuleFor(x => x.RequestUserId)
                .NotEmpty().WithMessage("RequestUserId is required.");

            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("ClinicId is required.");

            RuleFor(x => x.Request.ShareCode)
                .NotEmpty().WithMessage("ShareCode is required.")
                .MaximumLength(20).WithMessage("ShareCode cannot exceed 20 characters.")
                .Must(IsHealthShareCode)
                .WithMessage("ShareCode must use the HLT-XXX-XXX format.");
        }

        private static bool IsHealthShareCode(string? shareCode)
        {
            if (string.IsNullOrWhiteSpace(shareCode))
            {
                return true;
            }

            return Regex.IsMatch(
                shareCode.Trim(),
                "^HLT-[2-9A-HJ-NP-Z]{3}-[2-9A-HJ-NP-Z]{3}$",
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }
    }
}
