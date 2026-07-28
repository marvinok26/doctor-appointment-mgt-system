using System.Net;
using System.Text.Json;
using FluentValidation;
using HospitalSystem.Domain.Exceptions;
using ValidationException = HospitalSystem.Application.Common.Behaviors.ValidationException;

namespace HospitalSystem.Api.Middleware;

public record ApiError(string Title, int Status, string? Detail = null, IDictionary<string, string[]>? Errors = null);

/// <summary>Single place mapping domain/validation exceptions to consistent HTTP status codes and a
/// uniform JSON error shape, so the frontend never has to special-case per-endpoint error formats.</summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception ex)
    {
        var (status, error) = ex switch
        {
            ValidationException vex => (HttpStatusCode.BadRequest,
                new ApiError("Validation failed.", 400, Errors: vex.Errors)),
            NotFoundException nfex => (HttpStatusCode.NotFound, new ApiError(nfex.Message, 404)),
            ForbiddenDomainException fex => (HttpStatusCode.Forbidden, new ApiError(fex.Message, 403)),
            SchedulingConflictException scex => (HttpStatusCode.Conflict, new ApiError(scex.Message, 409)),
            DomainException dex => (HttpStatusCode.BadRequest, new ApiError(dex.Message, 400)),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, new ApiError("Unauthorized.", 401)),
            _ => (HttpStatusCode.InternalServerError, new ApiError("An unexpected error occurred.", 500))
        };

        if (status == HttpStatusCode.InternalServerError)
            logger.LogError(ex, "Unhandled exception processing {Method} {Path}", context.Request.Method, context.Request.Path);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)status;
        await context.Response.WriteAsync(JsonSerializer.Serialize(error, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
    }
}
