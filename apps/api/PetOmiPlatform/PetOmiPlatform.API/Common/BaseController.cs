using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Exceptions;
using System.Security.Claims;

namespace PetOmiPlatform.API.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaseController(IMediator mediator) : ControllerBase
    {
        protected IMediator Mediator => mediator;

        protected Guid CurrentUserId
        {
            get
            {
                var rawUserId =
                    User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                    User.FindFirstValue("nameid") ??
                    User.FindFirstValue("sub");

                if (string.IsNullOrWhiteSpace(rawUserId) || !Guid.TryParse(rawUserId, out var userId))
                {
                    throw new UnauthorizedException("Không thể xác định userId từ token đăng nhập. Vui lòng đăng nhập lại.");
                }

                return userId;
            }
        }
    }
}
