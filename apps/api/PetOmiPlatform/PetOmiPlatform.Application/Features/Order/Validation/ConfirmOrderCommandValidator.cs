using FluentValidation;
using PetOmiPlatform.Application.Features.Order.Command;

namespace PetOmiPlatform.Application.Features.Order.Validation
{
    public class ConfirmOrderCommandValidator : AbstractValidator<ConfirmOrderCommand>
    {
        public ConfirmOrderCommandValidator()
        {
            RuleFor(x => x.ClinicId).NotEmpty();
            RuleFor(x => x.OrderId).NotEmpty();
        }
    }
}
