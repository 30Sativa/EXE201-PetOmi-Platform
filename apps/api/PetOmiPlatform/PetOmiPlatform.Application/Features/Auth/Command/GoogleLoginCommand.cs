using MediatR;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Command
{
    public record GoogleLoginCommand(string AccessToken) : IRequest<LoginResponse>
    {
    }
}
