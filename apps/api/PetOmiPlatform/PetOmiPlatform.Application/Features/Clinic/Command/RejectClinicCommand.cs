using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record RejectClinicCommand(Guid AdminId, Guid ClinicId, string Reason) : IRequest<ReviewClinicResponse>, IAuditableCommand
    {
        public Guid? UserId => AdminId;
        public string Action => "RejectClinic";
        public string Category => "Clinic";
    }
}
