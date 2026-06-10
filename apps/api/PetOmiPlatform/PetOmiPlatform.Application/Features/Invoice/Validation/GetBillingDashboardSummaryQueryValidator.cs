using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Query;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class GetBillingDashboardSummaryQueryValidator : AbstractValidator<GetBillingDashboardSummaryQuery>
    {
        public GetBillingDashboardSummaryQueryValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID không được để trống.");
        }
    }
}
