using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Command
{
    public record RevokePetHealthShareCommand(
        Guid RequestUserId,
        Guid PetId,
        Guid ShareTokenId) : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => RequestUserId;
        public string Action => "RevokePetHealthShare";
        public string Category => "PetHealthShare";
    }
}
