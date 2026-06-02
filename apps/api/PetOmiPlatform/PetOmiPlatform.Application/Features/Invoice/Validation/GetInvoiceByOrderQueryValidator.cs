using FluentValidation;
using PetOmiPlatform.Application.Features.Invoice.Query;

namespace PetOmiPlatform.Application.Features.Invoice.Validation
{
    public class GetInvoiceByOrderQueryValidator : AbstractValidator<GetInvoiceByOrderQuery>
    {
        public GetInvoiceByOrderQueryValidator()
        {
            RuleFor(x => x.ClinicId).NotEmpty();
            RuleFor(x => x.OrderId).NotEmpty();
        }
    }
}
