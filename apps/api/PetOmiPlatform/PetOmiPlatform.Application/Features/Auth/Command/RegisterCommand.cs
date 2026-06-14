using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Feature.Auth.DTOs.Response;
using PetOmiPlatform.Application.Features.Auth.DTOs.Request;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Command
{
    public record RegisterCommand(RegisterRequest Request, string? Client = null) : IRequest<RegisterResponse>, IAuditableCommand
    {
        public Guid? UserId => null;
        public string Action => "Register";
        public string Category => "Auth";
    }
}
