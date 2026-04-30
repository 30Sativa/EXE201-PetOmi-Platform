using FluentValidation;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Behaviors
{
    public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    {
        private readonly IEnumerable<IValidator<TRequest>> _validators;
        public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        {
            _validators = validators;
        }
        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            // Không có validator → bỏ qua
            if (!_validators.Any())
            {
                return await next();
            }

            // Có validator → chạy validate
            var context = new ValidationContext<TRequest>(request);

            var failures = (await Task.WhenAll(
                    _validators.Select(v => v.ValidateAsync(context, cancellationToken))
                ))
                .SelectMany(r => r.Errors)
                .Where(f => f != null)
                .ToList();

            if (failures.Count > 0)
            {
                foreach (var failure in failures)
                {
                    Console.WriteLine(
                        $"Property: {failure.PropertyName}, Error: {failure.ErrorMessage}");
                }

                throw new Exceptions.ValidationException(failures);
            }

            return await next(); // hợp lệ → tiếp tục
        }
    }
}