using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Behaviors
{
    public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    {
        private readonly ILogger<TRequest> _logger;

        public LoggingBehavior(ILogger<TRequest> logger)
        {
            _logger = logger;
        }
        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Handling {RequestName}", typeof(TRequest).Name);

            var response = await next();

            _logger.LogInformation("Handled {RequestName}", typeof(TRequest).Name);

            return response;
        }
    }
}
