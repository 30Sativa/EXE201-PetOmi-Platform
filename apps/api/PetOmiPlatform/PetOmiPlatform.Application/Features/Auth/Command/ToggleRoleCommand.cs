using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Command
{
    public record ToggleRoleCommand(Guid UserId, string TargetRole, Guid? ClinicId = null) : IRequest<ToggleRoleResponse>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        public string Action => $"ToggleRole:{TargetRole}";
        public string Category => "Auth";
    }
}
