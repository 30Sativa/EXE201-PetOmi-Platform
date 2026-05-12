using MediatR;
using PetOmiPlatform.Application.Features.Auth.DTOs.Request;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Command
{
    public record LogoutCommand(LogoutRequest Request) : IRequest
    {
    }
}
