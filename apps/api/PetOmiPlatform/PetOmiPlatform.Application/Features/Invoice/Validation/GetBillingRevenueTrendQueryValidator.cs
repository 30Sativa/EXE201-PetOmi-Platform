using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Query;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class GetBillingRevenueTrendQueryValidator : AbstractValidator<GetBillingRevenueTrendQuery>
    {
        public GetBillingRevenueTrendQueryValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID khong duoc de trong.");

            RuleFor(x => x.ToDate)
                .GreaterThanOrEqualTo(x => x.FromDate)
                .WithMessage("ToDate phai lon hon hoac bang FromDate.");

            RuleFor(x => x)
                .Must(x => x.ToDate.DayNumber - x.FromDate.DayNumber <= 365)
                .WithMessage("Khoang ngay toi da la 366 ngay.");
        }
    }
}
