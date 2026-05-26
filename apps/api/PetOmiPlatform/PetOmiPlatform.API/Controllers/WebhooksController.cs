using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Infrastructure.Common.Settings;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/webhooks")]
    [ApiController]
    [AllowAnonymous]
    public class WebhooksController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly SePaySettings _sePaySettings;

        public WebhooksController(IMediator mediator, IOptions<SePaySettings> sePaySettings)
        {
            _mediator = mediator;
            _sePaySettings = sePaySettings.Value;
        }

        [HttpPost("sepay")]
        public async Task<IActionResult> ReceiveSePayWebhook([FromBody] JsonElement payload)
        {
            var configuredApiKey = _sePaySettings.WebhookApiKey;
            var receivedApiKey = Request.Headers["X-SePay-ApiKey"].FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(configuredApiKey) &&
                !string.Equals(configuredApiKey, receivedApiKey, StringComparison.Ordinal))
            {
                return Unauthorized(new { success = false });
            }

            var rawPayload = payload.GetRawText();
            var webhookRequest = JsonSerializer.Deserialize<SePayWebhookRequest>(
                rawPayload,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (webhookRequest == null)
            {
                return BadRequest(new { success = false });
            }

            var command = new HandleSePayWebhookCommand(webhookRequest, receivedApiKey, rawPayload);
            await _mediator.Send(command);

            return Ok(new { success = true });
        }
    }
}
