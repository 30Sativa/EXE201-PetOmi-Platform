using MediatR;
using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Behaviors
{
    public class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    {
        private readonly IUnitOfWork _uow;
        private readonly ILogger<TransactionBehavior<TRequest, TResponse>> _logger;


        public TransactionBehavior(IUnitOfWork uow, ILogger<TransactionBehavior<TRequest, TResponse>> logger)
        {
            _uow = uow;
            _logger = logger;
        }
        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            // bắt đầu transaction
            await _uow.BeginTransactionAsync();

            try
            {
                // chạy handler
                var response = await next();

                // commit dữ liệu
                await _uow.SaveChangesAsync(cancellationToken);

                await _uow.CommitTransactionAsync();

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transaction failed for {Request}", typeof(TRequest).Name);

                await _uow.RollbackTransactionAsync();

                throw; // đẩy lên ExceptionBehavior
            }
        }
    }
}
