using FluentValidation;
using PetOmiPlatform.Application.Features.ChatSubscription.Commands;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Validation;

public class CreateChatSubscriptionPaymentCommandValidator : AbstractValidator<CreateChatSubscriptionPaymentCommand>
{
    public CreateChatSubscriptionPaymentCommandValidator()
    {
        RuleFor(x => x.OwnerUserId).NotEmpty();
        RuleFor(x => x.Request.PetId).NotEmpty();
        RuleFor(x => x.Request.PlanCode)
            .NotEmpty()
            .MaximumLength(40);
    }
}
