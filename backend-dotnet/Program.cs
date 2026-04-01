using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using PetraApp.Api.Data;
using PetraApp.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Entra ID / MSAL Authentication ──────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// ── Rollen-Autorisierung ─────────────────────────────────────────────────────
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Mitarbeiter", p => p.RequireRole(
        "App.Mitarbeiter", "App.Admin"));

    options.AddPolicy("Taxifahrer", p => p.RequireRole(
        "App.Taxifahrer", "App.Admin"));

    options.AddPolicy("Disposition", p => p.RequireRole(
        "App.Disposition", "App.Taxifahrer", "App.Mitarbeiter", "App.Admin"));

    options.AddPolicy("Admin", p => p.RequireRole("App.Admin"));
});

// ── Datenbank ─────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<AlgorithmService>();

// ── CORS (für Static Web App & lokale Entwicklung) ───────────────────────────
builder.Services.AddCors(options =>
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
            builder.Configuration["AllowedOrigins"] ?? "https://localhost:5173",
            "https://localhost:5173",
            "http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

builder.Services.AddControllers();

// ── Swagger mit Entra-ID-Auth-Flow ───────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Petra App — ZRH Vorfeld Taxi API",
        Version = "v1"
    });

    var tenantId = builder.Configuration["AzureAd:TenantId"];
    var clientId = builder.Configuration["AzureAd:ClientId"];

    c.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.OAuth2,
        Flows = new OpenApiOAuthFlows
        {
            AuthorizationCode = new OpenApiOAuthFlow
            {
                AuthorizationUrl = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize"),
                TokenUrl         = new Uri($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token"),
                Scopes = new Dictionary<string, string>
                {
                    { $"api://{clientId}/access_as_user", "Zugriff als Mitarbeiter" }
                }
            }
        }
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "oauth2" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── DB-Migrations beim Start anwenden ────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// ── Middleware Pipeline ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Petra App v1");
        c.OAuthClientId(builder.Configuration["AzureAd:ClientId"]);
        c.OAuthUsePkce();
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
