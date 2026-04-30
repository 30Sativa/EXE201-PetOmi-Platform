using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using PetOmiPlatform.Application.Behaviors;
using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;

namespace PetOmiPlatform.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            var assembly = Assembly.GetExecutingAssembly();

            // MediatR
            services.AddMediatR(cfg =>
                cfg.RegisterServicesFromAssembly(assembly));

            // FluentValidation
            services.AddValidatorsFromAssembly(assembly);

            // Pipeline Behaviors (thứ tự QUAN TRỌNG)
            // Thứ tự đúng — ngoài vào trong
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));           // 1. Log request
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ExceptionHandlingBehavior<,>)); // 2. Bắt exception
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));        // 3. Validate trước
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));       // 4. Transaction sau
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));       // 5. Đo performance

            return services;
        }
    }
}
