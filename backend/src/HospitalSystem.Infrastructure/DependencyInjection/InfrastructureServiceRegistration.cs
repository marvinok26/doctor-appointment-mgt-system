using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Interfaces;
using HospitalSystem.Infrastructure.Identity;
using HospitalSystem.Infrastructure.Persistence;
using HospitalSystem.Infrastructure.Persistence.Repositories;
using HospitalSystem.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace HospitalSystem.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("Default"),
                sql => sql.EnableRetryOnFailure(maxRetryCount: 3)));

        // AddIdentityCore (not AddIdentity) deliberately: AddIdentity also registers Identity's
        // own cookie authentication scheme and pins it as the default authenticate/challenge
        // scheme, which wins over the JwtBearer scheme registered below even when JwtBearer is
        // passed as AddAuthentication's default — the two "default scheme" settings aren't the
        // same thing, and Identity's is more specific. Every [Authorize] endpoint was silently
        // challenging as if this were a cookie-based MVC app (redirecting to /Account/Login)
        // instead of returning a JWT-style 401, since this API never uses cookie sign-in.
        // AddIdentityCore only wires up UserManager/RoleManager/password hashing — no scheme.
        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequiredLength = 10;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireDigit = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        var redisConnectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnectionString));
        services.AddStackExchangeRedisCache(options => options.Configuration = redisConnectionString);

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));

        services.AddHttpContextAccessor();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ICacheService, CacheService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        return services;
    }
}
