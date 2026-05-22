using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record CancelInvoiceCommand(
        Guid ClinicId,
        Guid InvoiceId
    ) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => null;
        public string Action => "CancelInvoice";
        public string Category => "Invoice";
    }
}
