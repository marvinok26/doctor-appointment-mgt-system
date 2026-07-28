using System.Reflection;
using FluentValidation;
using HospitalSystem.Application.Auth.Commands;
using HospitalSystem.Application.Common.Behaviors;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace HospitalSystem.Application.DependencyInjection;

public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        // Registered by concrete type too: VerifyMfaCommandHandler reuses LoginCommandHandler's
        // session-issuing logic directly rather than duplicating it or round-tripping through MediatR.
        services.AddTransient<LoginCommandHandler>();

        return services;
    }
}
