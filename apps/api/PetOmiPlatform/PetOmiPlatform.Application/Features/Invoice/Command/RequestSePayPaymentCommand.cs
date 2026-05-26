using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record RequestSePayPaymentCommand(
        Guid ClinicId,
        Guid StaffUserId,
        Guid InvoiceId,
        RequestSePayPaymentRequest Payload
    ) : IRequest<SePayPaymentRequestResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "RequestSePayPayment";
        public string Category => "Invoice";
    }
}
