using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Query;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class GetSePayReconciliationQueryValidator : AbstractValidator<GetSePayReconciliationQuery>
    {
        public GetSePayReconciliationQueryValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID không được để trống.");

            RuleFor(x => x.Limit)
                .InclusiveBetween(1, 200)
                .WithMessage("Limit phải trong khoảng 1-200.");

            RuleFor(x => x.AlertAfterMinutes)
                .InclusiveBetween(1, 1440)
                .WithMessage("AlertAfterMinutes phải trong khoảng 1-1440 phút.");
        }
    }
}
