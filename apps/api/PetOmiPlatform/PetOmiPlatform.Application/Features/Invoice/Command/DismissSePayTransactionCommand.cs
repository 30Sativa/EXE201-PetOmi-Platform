using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record DismissSePayTransactionCommand(
        Guid ClinicId,
        Guid StaffUserId,
        Guid PaymentTransactionId,
        string ReviewNote
    ) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "DismissSePayTransaction";
        public string Category => "Invoice";
    }
}
