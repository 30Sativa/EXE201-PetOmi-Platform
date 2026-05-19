using FluentValidation;
using PetOmiPlatform.Application.Features.UserProfile.Query;
using System;

namespace PetOmiPlatform.Application.Features.UserProfile.Validation
{
    public class GetUserProfileValidator : AbstractValidator<GetUserProfileQuery>
    {
        public GetUserProfileValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống");
        }
    }
}
