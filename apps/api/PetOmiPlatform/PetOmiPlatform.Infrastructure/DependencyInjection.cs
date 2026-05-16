using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;
using PetOmiPlatform.Infrastructure.Common.Settings;
using PetOmiPlatform.Infrastructure.External;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.UnitOfWork;
using PetOmiPlatform.Infrastructure.Security.Jwt;
using PetOmiPlatform.Infrastructure.Security.PasswordHasher;
using PetOmiPlatform.Infrastructure.Security.Token;
using PetOmiPlatform.Infrastructure.Services;
using Resend;
using System.Text;

namespace PetOmiPlatform.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // DbContext
            services.AddDbContext<PetOmniDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection")));

            // Jwt Settings
            services.Configure<JwtSettings>(
                configuration.GetSection("JwtSettings"));

            // JWT Authentication
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                var jwtSettings = configuration.GetSection("JwtSettings");
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
                };
            })
            .AddGoogle("Google", options =>  
            {
                options.ClientId = configuration["Authentication:Google:ClientId"]!;
                options.ClientSecret = configuration["Authentication:Google:ClientSecret"]!;
                options.CallbackPath = "/api/auth/google/callback";
                options.Scope.Add("email");
                options.Scope.Add("profile");
            });


            // Resend
            services.Configure<ResendClientOptions>(options =>
            {
                options.ApiToken = configuration["Resend:ApiKey"];
            });
            services.AddHttpClient();
            services.AddTransient<ResendClient>();

            // Repositories
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
            services.AddScoped<IVetProfileRepository, VetProfileRepository>();
            services.AddScoped<IClinicRepository, ClinicRepository>();
            services.AddScoped<IVetClinicRepository, VetClinicRepository>();
            services.AddScoped<IAuditLogRepository, AuditLogRepository>();
            services.AddHttpContextAccessor();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddScoped<IExternalLoginRepository, ExternalLoginRepository>();
            services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();
            // Services
            services.AddScoped<IEmailService, EmailService>();

            return services;
        }
    }
}