using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;

namespace PetOmiPlatform.Application.Behaviors
{
    public class PerformanceBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    {
        private readonly Stopwatch _timer;
        private readonly ILogger<TRequest> _logger;

        public PerformanceBehavior(ILogger<TRequest> logger)
        {
            _timer = new Stopwatch();
            _logger = logger;
        }
        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            _timer.Start();

            var response = await next();

            _timer.Stop();

            var elapsed = _timer.ElapsedMilliseconds;

            if (elapsed > 500)
            {
                _logger.LogWarning(
                    "Long Running Request: {Name} ({Time} ms) {@Request}",
                    typeof(TRequest).Name,
                    elapsed,
                    request);
            }

            return response;
        }
    }
}
