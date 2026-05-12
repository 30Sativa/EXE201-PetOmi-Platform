using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Command
{
    public record LogoutAllCommand(Guid UserId) : IRequest;
}
