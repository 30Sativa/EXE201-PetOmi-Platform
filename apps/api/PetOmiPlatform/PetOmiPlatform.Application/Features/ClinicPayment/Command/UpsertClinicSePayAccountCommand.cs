using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Request;
using PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.ClinicPayment.Command
{
    public record UpsertClinicSePayAccountCommand(
        Guid ClinicId,
        Guid StaffUserId,
        UpsertClinicSePayAccountRequest Payload
    ) : IRequest<ClinicSePayAccountResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "UpsertClinicSePayAccount";
        public string Category => "ClinicPayment";
    }
}
