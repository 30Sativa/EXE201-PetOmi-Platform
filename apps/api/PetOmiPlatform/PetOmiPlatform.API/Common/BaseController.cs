using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Common.Models;

namespace PetOmiPlatform.API.Common
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaseController : ControllerBase
    {
        protected readonly IMediator Mediator;

        protected BaseController(IMediator mediator)
            => Mediator = mediator;

        // helper map Result → IActionResult
        protected IActionResult HandleResult<T>(Result<T> result) where T : class
        {
            if (result.IsFailure)
                return StatusCode(result.StatusCode, BaseResponse<T>.Fail(result.Error!, result.StatusCode));

            return Ok(BaseResponse<T>.Ok(result.Value!));
        }
    }
}
