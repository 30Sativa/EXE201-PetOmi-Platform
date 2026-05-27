using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Query;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class GetPendingManualRefundsQueryValidator : AbstractValidator<GetPendingManualRefundsQuery>
    {
        public GetPendingManualRefundsQueryValidator()
        {
            RuleFor(x => x.Page)
                .GreaterThan(0).WithMessage("Page phai lon hon 0.");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 200).WithMessage("PageSize phai trong khoang 1..200.");
        }
    }
}
