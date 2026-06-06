using MediatR;
using PetOmiPlatform.Application.Features.Auth.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Auth.Command
{
    public record SetPasswordCommand(Guid UserId, SetPasswordRequest Request) : IRequest;
}
