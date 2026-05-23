using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Request;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Prescription.Command
{
    public record AddPrescriptionItemCommand(
        Guid ClinicId,
        Guid StaffUserId,
        Guid ExaminationId,
        AddPrescriptionItemRequest Payload
    ) : IRequest<PrescriptionItemResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "AddPrescriptionItem";
        public string Category => "Prescription";
    }
}
