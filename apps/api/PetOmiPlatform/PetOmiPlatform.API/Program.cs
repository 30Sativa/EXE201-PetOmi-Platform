using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using PetOmiPlatform.API.Common.Authorization;
using PetOmiPlatform.API.Middlewares;
using PetOmiPlatform.Application;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Infrastructure;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// =======================
// ADD SERVICES
// =======================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

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
});

// Application layer
builder.Services.AddApplication();

// Authorization policies — phải trước AddInfrastructure
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

// Infrastructure layer — sau cùng
builder.Services.AddInfrastructure(builder.Configuration);

// =======================
// BUILD APP
// =======================

var app = builder.Build();

// =======================
// MIDDLEWARE PIPELINE
// =======================

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();