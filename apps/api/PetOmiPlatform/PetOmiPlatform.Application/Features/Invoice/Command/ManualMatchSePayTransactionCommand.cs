using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record ManualMatchSePayTransactionCommand(
        Guid ClinicId,
        Guid StaffUserId,
        Guid PaymentTransactionId,
        Guid InvoiceId,
        string? ReviewNote
    ) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "ManualMatchSePayTransaction";
        public string Category => "Invoice";
    }
}
