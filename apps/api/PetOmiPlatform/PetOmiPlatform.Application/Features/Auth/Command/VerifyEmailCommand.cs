using MediatR;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Auth.Command
{
    public record VerifyEmailCommand(string Token) : IRequest<VerifyEmailResponse>;
}
