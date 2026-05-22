using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record PayInvoiceCommand(
        Guid ClinicId,
        Guid InvoiceId,
        PayInvoiceRequest Payload
    ) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => null;
        public string Action => "PayInvoice";
        public string Category => "Invoice";
    }
}
