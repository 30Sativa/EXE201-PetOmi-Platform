using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record ConfirmManualRefundCommand(
        Guid ClinicId,
        Guid StaffUserId,
        Guid InvoiceId,
        string RefundNote
    ) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "ConfirmManualRefund";
        public string Category => "Invoice";
    }
}
