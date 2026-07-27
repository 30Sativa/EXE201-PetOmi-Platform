using MediatR;
using PetOmiPlatform.Application.Features.Auth.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Auth.Command
{
    public record ResendVerificationCommand(
        ResendVerificationRequest Request,
        string? Client = null) : IRequest;
}
