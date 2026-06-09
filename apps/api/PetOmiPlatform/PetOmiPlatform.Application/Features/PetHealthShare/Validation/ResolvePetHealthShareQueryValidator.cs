using FluentValidation;
using PetOmiPlatform.Application.Features.PetHealthShare.Query;

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
                .MaximumLength(20).WithMessage("ShareCode cannot exceed 20 characters.");
        }
    }
}
