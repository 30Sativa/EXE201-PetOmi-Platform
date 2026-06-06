


using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Features.PetAi.Interfaces;
using PetOmiPlatform.Domain.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;
using PetOmiPlatform.Infrastructure.Common.Settings;
using PetOmiPlatform.Infrastructure.External;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.UnitOfWork;
using PetOmiPlatform.Infrastructure.Persistence.Repositories.PetAi;
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
        private const string GoogleExternalCookieScheme = "GoogleExternal";

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

            // Cloudinary Settings
            services.Configure<CloudinarySettings>(
                configuration.GetSection("Cloudinary"));

            // SePay settings
            services.Configure<SePaySettings>(
                configuration.GetSection("SePay"));

            // Jwt
            var jwtSection = configuration.GetSection("JwtSettings");
            services.Configure<JwtSettings>(jwtSection);
            var googleSection = configuration.GetSection("Authentication:Google");
            services.Configure<GoogleAuthSettings>(googleSection);

            var jwtSettings = jwtSection.Get<JwtSettings>()!;
            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;

                            if (!string.IsNullOrEmpty(accessToken)
                                && path.StartsWithSegments("/hubs"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer           = true,
                        ValidateAudience         = true,
                        ValidateLifetime         = true,
                        ValidateIssuerSigningKey  = true,
                        ValidIssuer              = jwtSettings.Issuer,
                        ValidAudience            = jwtSettings.Audience,
                        IssuerSigningKey         = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(jwtSettings.Secret))
                    };
                })
                .AddCookie(GoogleExternalCookieScheme, options =>
                {
                    options.Cookie.Name = "PetOmi.Google.External";
                    options.ExpireTimeSpan = TimeSpan.FromMinutes(5);
                    options.SlidingExpiration = false;
                    options.Cookie.SameSite = SameSiteMode.Lax;
                    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                })
                .AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
                {
                    var googleSettings = googleSection.Get<GoogleAuthSettings>() ?? new GoogleAuthSettings();
                    options.ClientId = googleSettings.ClientId ?? string.Empty;
                    options.ClientSecret = googleSettings.ClientSecret ?? string.Empty;
                    options.CallbackPath = "/api/auth/google/signin";
                    options.SignInScheme = GoogleExternalCookieScheme;
                    options.SaveTokens = true;
                    options.CorrelationCookie.SameSite = SameSiteMode.Lax;
                    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
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
            services.AddScoped<IRoleRepository, RoleRepository>();
            services.AddScoped<IUserProfileRepository, UserProfileRepository>();
            services.AddScoped<IVetProfileRepository, VetProfileRepository>();
            services.AddScoped<IClinicRepository, ClinicRepository>();
            services.AddScoped<IClinicServiceRepository, ClinicServiceRepository>();
            services.AddScoped<IDoctorScheduleRepository, DoctorScheduleRepository>();
            services.AddScoped<IInventoryRepository, InventoryRepository>();
            services.AddScoped<IVetClinicRepository, VetClinicRepository>();
            services.AddScoped<IAppointmentRepository, AppointmentRepository>();
            services.AddScoped<IAuditLogRepository, AuditLogRepository>();
            services.AddScoped<ISystemSettingRepository, SystemSettingRepository>();
            services.AddScoped<IPetRepository, PetRepository>();
            services.AddScoped<IPetHealthProfileRepository, PetHealthProfileRepository>();
            services.AddScoped<IPetWeightLogRepository, PetWeightLogRepository>();
            services.AddScoped<IPetPhotoRepository, PetPhotoRepository>();
            services.AddScoped<IPetMedicalRecordRepository, PetMedicalRecordRepository>();
            services.AddScoped<IPetUserAccessRepository, PetUserAccessRepository>();
            
            // Sprint 5 - Clinic Visit Flow
            services.AddScoped<IMedicalExaminationRepository, MedicalExaminationRepository>();
            services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
            services.AddScoped<IInvoiceRepository, InvoiceRepository>();
            services.AddScoped<IOrderRepository, OrderRepository>();
            services.AddScoped<IClinicPaymentAccountRepository, ClinicPaymentAccountRepository>();
            services.AddScoped<IPaymentTransactionRepository, PaymentTransactionRepository>();
            services.AddScoped<ISePayService, SePayService>();
            
            services.AddHttpContextAccessor();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddScoped<IExternalLoginRepository, ExternalLoginRepository>();
            services.AddHttpClient<IGoogleAuthService, GoogleAuthService>();
            // Services
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<ICloudinaryService, CloudinaryService>();
            services.AddScoped<IPetAvatarService, PetAvatarService>();
            services.AddScoped<IPetCodeGenerator, PetCodeGenerator>();


            // Reminders
            services.AddScoped<IReminderRepository, ReminderRepository>();
            services.AddScoped<IReminderPreferenceRepository, ReminderPreferenceRepository>();
            services.AddScoped<IReminderAutoCreator, ReminderAutoCreator>();
            services.AddScoped<INotificationDispatcher, NotificationDispatcher>();

            // Background services
            var enableReminderProcessor = string.Equals(
                configuration["ReminderProcessor:Enabled"],
                "true",
                StringComparison.OrdinalIgnoreCase);

            if (enableReminderProcessor)
            {
                services.AddHostedService<BackgroundServices.ReminderProcessorService>();
            }

            // AI background worker
            services.AddSingleton<IAiTaskQueue, BackgroundServices.AiTaskQueue>();
            services.AddHostedService<BackgroundServices.AiBackgroundService>();

            // AI Service client
            services.AddHttpClient("AiService");
            services.AddScoped<IAiServiceClient, AiServiceClient>();

            // Chat repositories
            services.AddScoped<IConversationRepository, ConversationRepository>();
            services.AddScoped<IChatMessageRepository, ChatMessageRepository>();

            // Pet AI internal endpoints (for Python AI Service)
            services.AddScoped<IPetAiRepository, PetAiRepository>();

            return services;
        }
    }
}
