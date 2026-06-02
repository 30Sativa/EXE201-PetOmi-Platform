using FluentValidation;
using PetOmiPlatform.Application.Features.Order.Query;

namespace PetOmiPlatform.Application.Features.Order.Validation
{
    public class GetOrderByIdQueryValidator : AbstractValidator<GetOrderByIdQuery>
    {
        public GetOrderByIdQueryValidator()
        {
            RuleFor(x => x.ClinicId).NotEmpty();
            RuleFor(x => x.OrderId).NotEmpty();
        }
    }
}
