using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            //  DbContext (DB-first)
            services.AddDbContext<PetOmniDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("Default")));

            //  Repositories
            //services.AddScoped<IUserRepository, UserRepository>();
            // services.AddScoped<IOrderRepository, OrderRepository>();

            // ✅ Services (infra only)
            // services.AddScoped<IEmailService, EmailService>();

            return services;
        }
    }
}
