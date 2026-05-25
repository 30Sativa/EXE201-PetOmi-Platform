using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Request;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Prescription.Command
{
    public record UpdatePrescriptionItemCommand(
        Guid ClinicId,
        Guid StaffUserId,
        Guid PrescriptionId,
        UpdatePrescriptionItemRequest Payload
    ) : IRequest<PrescriptionItemResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "UpdatePrescriptionItem";
        public string Category => "Prescription";
    }
}
