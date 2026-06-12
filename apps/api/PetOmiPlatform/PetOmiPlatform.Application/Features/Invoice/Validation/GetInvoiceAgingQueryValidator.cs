using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Query;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class GetInvoiceAgingQueryValidator : AbstractValidator<GetInvoiceAgingQuery>
    {
        public GetInvoiceAgingQueryValidator()
        {
            RuleFor(x => x.ClinicId)
                .NotEmpty().WithMessage("Clinic ID không được để trống.");

            RuleFor(x => x.Page)
                .GreaterThan(0).WithMessage("Page phai lon hon 0.");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 200)
                .WithMessage("PageSize phải trong khoảng 1-200.");

            RuleFor(x => x.MinAgeDays)
                .InclusiveBetween(0, 3650)
                .WithMessage("MinAgeDays phải trong khoảng 0-3650.");
        }
    }
}
