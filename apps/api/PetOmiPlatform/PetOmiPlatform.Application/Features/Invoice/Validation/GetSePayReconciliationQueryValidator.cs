using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Query;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class GetSePayReconciliationQueryValidator : AbstractValidator<GetSePayReconciliationQuery>
    {
        public GetSePayReconciliationQueryValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID khong duoc de trong.");

            RuleFor(x => x.Limit)
                .InclusiveBetween(1, 200)
                .WithMessage("Limit phai trong khoang 1-200.");
        }
    }
}
