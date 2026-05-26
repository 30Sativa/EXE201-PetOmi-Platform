using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record AutoComposeInvoiceCommand(
        Guid ClinicId,
        Guid StaffUserId,
        AutoComposeInvoiceRequest Payload
    ) : IRequest<InvoiceResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "AutoComposeInvoice";
        public string Category => "Invoice";
    }
}
