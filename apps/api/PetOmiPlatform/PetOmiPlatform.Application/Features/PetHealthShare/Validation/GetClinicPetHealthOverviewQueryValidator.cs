using FluentValidation;
using PetOmiPlatform.Application.Features.PetHealthShare.Query;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Validation
{
    public class GetClinicPetHealthOverviewQueryValidator : AbstractValidator<GetClinicPetHealthOverviewQuery>
    {
        public GetClinicPetHealthOverviewQueryValidator()
        {
            RuleFor(x => x.RequestUserId)
                .NotEmpty().WithMessage("RequestUserId is required.");

            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("ClinicId is required.");

            RuleFor(x => x.PetId)
                .NotEmpty().WithMessage("PetId is required.");

            RuleFor(x => x.ShareCode)
                .MaximumLength(20).When(x => !string.IsNullOrWhiteSpace(x.ShareCode))
                .WithMessage("ShareCode cannot exceed 20 characters.");
        }
    }
}
