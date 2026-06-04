using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;

namespace PetOmiPlatform.API.Common.Authorization;

public class InternalApiKeyHandler : AuthorizationHandler<InternalApiKeyRequirement>
{
    private readonly IConfiguration _configuration;

    public InternalApiKeyHandler(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        InternalApiKeyRequirement requirement)
    {
        if (context.Resource is not HttpContext httpContext)
        {
            return Task.CompletedTask;
        }

        if (!httpContext.Request.Headers.TryGetValue("X-Api-Key", out var providedKey))
        {
            return Task.CompletedTask;
        }

        var configuredKey = _configuration["AiService:ApiKey"]
            ?? Environment.GetEnvironmentVariable("AI_SERVICE_API_KEY");

        if (string.IsNullOrEmpty(configuredKey))
        {
            return Task.CompletedTask;
        }

        if (string.Equals(providedKey, configuredKey, StringComparison.Ordinal))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
