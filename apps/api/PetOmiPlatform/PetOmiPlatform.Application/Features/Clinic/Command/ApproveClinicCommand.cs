using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record ApproveClinicCommand(Guid AdminId, Guid ClinicId) : IRequest<ReviewClinicResponse>, IAuditableCommand
    {
        public Guid? UserId => AdminId;
        public string Action => "ApproveClinic";
        public string Category => "Clinic";
    }
}
