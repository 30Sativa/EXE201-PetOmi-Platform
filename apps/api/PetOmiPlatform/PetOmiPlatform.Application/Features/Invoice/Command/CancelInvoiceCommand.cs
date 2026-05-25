using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record CancelInvoiceCommand(
        Guid ClinicId,
        Guid StaffUserId,
        Guid InvoiceId
    ) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "CancelInvoice";
        public string Category => "Invoice";
    }
}
