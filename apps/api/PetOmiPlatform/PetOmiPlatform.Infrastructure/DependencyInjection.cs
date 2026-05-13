using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;
using PetOmiPlatform.Infrastructure.Common.Settings;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.UnitOfWork;
using PetOmiPlatform.Infrastructure.Security.Jwt;
using PetOmiPlatform.Infrastructure.Security.PasswordHasher;
using PetOmiPlatform.Infrastructure.Security.Token;
using PetOmiPlatform.Infrastructure.Services;
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
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));
            services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
            services.Configure<SmtpSettings>(configuration.GetSection("SmtpSettings"));
            //  Repositories
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddScoped<ITokenGenerator, TokenGenerator>();
            services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
            services.AddScoped<IUserSessionRepository, UserSessionRepository>();
            services.AddScoped<IUserDeviceRepository, UserDeviceRepository>();
            services.AddScoped<IEmailVerificationTokenRepository, EmailVerificationTokenRepository>();
            services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
            services.AddScoped<IUserRoleRepository, UserRoleRepository>();
            //  Services (infra only)
            services.AddScoped<IEmailService, EmailService>();

            return services;
        }
    }
}
