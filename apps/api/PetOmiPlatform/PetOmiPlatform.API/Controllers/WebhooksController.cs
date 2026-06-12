using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PetOmiPlatform.Application.Features.ChatSubscription.Commands;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Infrastructure.Common.Settings;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// Webhook endpoints cho các provider thanh toán/ngoài hệ thống.
    /// </summary>
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

        /// <summary>Webhook SePay thông báo biến động giao dịch vào tài khoản clinic.</summary>
        /// <remarks>
        /// Backend sẽ xác thực API key/HMAC (nếu bật), ghi PaymentTransaction, và auto-mark invoice Paid nếu match hợp lệ.
        /// </remarks>
        [HttpPost("sepay")]
        public async Task<IActionResult> ReceiveSePayWebhook()
        {
            string rawPayload;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            {
                rawPayload = await reader.ReadToEndAsync();
            }

            if (string.IsNullOrWhiteSpace(rawPayload))
            {
                return BadRequest(new { success = false });
            }

            var receivedApiKey = GetApiKeyFromHeaders();
            if (IsApiKeyInvalid(receivedApiKey))
            {
                return Unauthorized(new { success = false });
            }

            if (IsHmacSignatureInvalid(rawPayload))
            {
                return Unauthorized(new { success = false });
            }

            var webhookRequest = JsonSerializer.Deserialize<SePayWebhookRequest>(
                rawPayload,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (webhookRequest == null)
            {
                return BadRequest(new { success = false });
            }

            var subscriptionHandled = await _mediator.Send(
                new HandleChatSubscriptionSePayPaymentCommand(webhookRequest, rawPayload));

            if (!subscriptionHandled)
            {
                var command = new HandleSePayWebhookCommand(webhookRequest, receivedApiKey, rawPayload);
                await _mediator.Send(command);
            }

            return Ok(new { success = true });
        }

        private string? GetApiKeyFromHeaders()
        {
            var authorization = Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(authorization) &&
                authorization.StartsWith("Apikey ", StringComparison.OrdinalIgnoreCase))
            {
                return authorization[7..].Trim();
            }

            return Request.Headers["X-SePay-ApiKey"].FirstOrDefault();
        }

        private bool IsApiKeyInvalid(string? receivedApiKey)
        {
            var configuredApiKey = _sePaySettings.WebhookApiKey;
            if (string.IsNullOrWhiteSpace(configuredApiKey))
            {
                return false;
            }

            return !string.Equals(configuredApiKey, receivedApiKey, StringComparison.Ordinal);
        }

        private bool IsHmacSignatureInvalid(string rawPayload)
        {
            if (!_sePaySettings.RequireHmacSignature)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(_sePaySettings.WebhookSecret))
            {
                return true;
            }

            var signatureHeader = Request.Headers["X-SePay-Signature"].FirstOrDefault();
            var timestampHeader = Request.Headers["X-SePay-Timestamp"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(signatureHeader) || string.IsNullOrWhiteSpace(timestampHeader))
            {
                return true;
            }

            if (!long.TryParse(timestampHeader, out var timestampSeconds))
            {
                return true;
            }

            var nowSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (Math.Abs(nowSeconds - timestampSeconds) > _sePaySettings.MaxTimestampSkewSeconds)
            {
                return true;
            }

            var signedPayload = $"{timestampHeader}.{rawPayload}";
            var expectedHex = ComputeHmacSha256Hex(_sePaySettings.WebhookSecret, signedPayload);
            var expectedSignature = $"sha256={expectedHex}";
            return !FixedTimeEquals(expectedSignature, signatureHeader);
        }

        private static string ComputeHmacSha256Hex(string secret, string payload)
        {
            var secretBytes = Encoding.UTF8.GetBytes(secret);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);
            using var hmac = new HMACSHA256(secretBytes);
            var hashBytes = hmac.ComputeHash(payloadBytes);
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        private static bool FixedTimeEquals(string expected, string actual)
        {
            var left = Encoding.UTF8.GetBytes(expected);
            var right = Encoding.UTF8.GetBytes(actual);
            return CryptographicOperations.FixedTimeEquals(left, right);
        }
    }
}
