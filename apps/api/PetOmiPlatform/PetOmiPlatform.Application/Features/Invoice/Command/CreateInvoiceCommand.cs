using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record CreateInvoiceCommand(
        Guid ClinicId,
        Guid StaffUserId,
        CreateInvoiceRequest Payload
    ) : IRequest<InvoiceResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "CreateInvoice";
        public string Category => "Invoice";
    }
}
