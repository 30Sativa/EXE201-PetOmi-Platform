using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Request;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Command
{
    public record CreatePetHealthShareCommand(
        Guid RequestUserId,
        Guid PetId,
        CreatePetHealthShareRequest Request) : IRequest<PetHealthShareResponse>, IAuditableCommand
    {
        public Guid? UserId => RequestUserId;
        public string Action => "CreatePetHealthShare";
        public string Category => "PetHealthShare";
    }
}
