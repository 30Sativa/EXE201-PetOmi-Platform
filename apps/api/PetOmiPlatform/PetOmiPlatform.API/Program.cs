
using Microsoft.OpenApi.Models;
using PetOmiPlatform.API.Middlewares;
using PetOmiPlatform.Application;
using PetOmiPlatform.Infrastructure;

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
});

// Application + Infrastructure
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// =======================
// BUILD APP
// =======================

var app = builder.Build();

// =======================
// MIDDLEWARE
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