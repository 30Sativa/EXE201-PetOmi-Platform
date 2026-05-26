using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Common.Models;
using System.Security.Claims;

namespace PetOmiPlatform.API.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaseController(IMediator mediator) : ControllerBase
    {
        protected IMediator Mediator => mediator;

        protected Guid CurrentUserId
            => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
