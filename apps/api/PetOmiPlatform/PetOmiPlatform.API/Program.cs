using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.API.Common.Authorization;
using PetOmiPlatform.API.Hubs;
using PetOmiPlatform.API.Middlewares;
using PetOmiPlatform.API.Services;
using PetOmiPlatform.API.Swagger;
using PetOmiPlatform.Application;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Infrastructure;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// =======================
// ADD SERVICES
// =======================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "http://localhost:5273",
                "http://localhost:7297"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập token dạng: Bearer {your_token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        c.IncludeXmlComments(xmlPath);

    c.OperationFilter<FileUploadOperationFilter>();
});

// Application layer
builder.Services.AddApplication();

// SignalR
builder.Services.AddSignalR();

// Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.OwnerOnly, policy =>
        policy.Requirements.Add(new ActiveRoleRequirement(RoleConstants.Owner)));

    options.AddPolicy(Policies.AdminOnly, policy =>
        policy.Requirements.Add(new ActiveRoleRequirement(RoleConstants.Admin)));

    options.AddPolicy(Policies.VetOnly, policy =>
        policy.Requirements.Add(new ActiveRoleRequirement(RoleConstants.Vet)));
});

// Authorization handler
builder.Services.AddScoped<IAuthorizationHandler, ActiveRoleHandler>();

// Infrastructure layer
builder.Services.AddInfrastructure(builder.Configuration);

// SignalR broadcaster (API layer)
builder.Services.AddScoped<INotificationBroadcaster, SignalRNotificationBroadcaster>();

// =======================
// BUILD APP
// =======================

var app = builder.Build();

// =======================
// MIDDLEWARE PIPELINE
// =======================

app.UseMiddleware<ExceptionMiddleware>();

// Swagger — bật khi Development hoặc EnableSwagger=true trong config
var enableSwagger = app.Environment.IsDevelopment()
    || builder.Configuration.GetValue<bool>("EnableSwagger");

if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();