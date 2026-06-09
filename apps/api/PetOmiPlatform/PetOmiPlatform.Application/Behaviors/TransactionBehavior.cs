using MediatR;
using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Behaviors
{
    public class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : notnull
    {
        private readonly IUnitOfWork _uow;
        private readonly ILogger<TransactionBehavior<TRequest, TResponse>> _logger;

        public TransactionBehavior(IUnitOfWork uow, ILogger<TransactionBehavior<TRequest, TResponse>> logger)
        {
            _uow = uow;
            _logger = logger;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken)
        {
            if (request is INonTransactionalRequest)
            {
                return await next();
            }

            await _uow.BeginTransactionAsync();

            try
            {
                var response = await next();

                await _uow.SaveChangesAsync(cancellationToken);
                await _uow.CommitTransactionAsync();

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transaction failed for {Request}", typeof(TRequest).Name);

                await _uow.RollbackTransactionAsync();

                throw;
            }
        }
    }
}
