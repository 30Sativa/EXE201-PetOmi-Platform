using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Prescription.Command
{
    public record DeletePrescriptionItemCommand(
        Guid ClinicId,
        Guid PrescriptionId
    ) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => null;
        public string Action => "DeletePrescriptionItem";
        public string Category => "Prescription";
    }
}
