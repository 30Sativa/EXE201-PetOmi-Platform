using FluentValidation;
using PetOmiPlatform.Application.Features.PetHealthShare.Command;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Validation
{
    public class RevokePetHealthShareCommandValidator : AbstractValidator<RevokePetHealthShareCommand>
    {
        public RevokePetHealthShareCommandValidator()
        {
            RuleFor(x => x.PetId)
                .NotEmpty().WithMessage("PetId is required.");

            RuleFor(x => x.ShareTokenId)
                .NotEmpty().WithMessage("ShareTokenId is required.");
        }
    }
}
