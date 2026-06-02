using FluentValidation;
using PetOmiPlatform.Application.Features.Order.Command;

namespace PetOmiPlatform.Application.Features.Order.Validation
{
    public class CancelOrderCommandValidator : AbstractValidator<CancelOrderCommand>
    {
        public CancelOrderCommandValidator()
        {
            RuleFor(x => x.ClinicId).NotEmpty();
            RuleFor(x => x.OrderId).NotEmpty();
        }
    }
}
