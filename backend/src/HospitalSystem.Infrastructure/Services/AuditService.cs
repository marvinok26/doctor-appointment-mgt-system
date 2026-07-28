using System.Text.Json;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Entities;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Infrastructure.Persistence;

namespace HospitalSystem.Infrastructure.Services;

public class AuditService(ApplicationDbContext context, ICurrentUserService currentUser) : IAuditService
{
    public async Task LogAsync(
        AuditAction action,
        string entityName,
        string? entityId = null,
        object? oldValues = null,
        object? newValues = null,
        Guid? userId = null,
        string? userEmail = null,
        CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            UserId = userId ?? currentUser.UserId,
            UserEmail = userEmail ?? currentUser.Email,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            OldValues = oldValues is null ? null : JsonSerializer.Serialize(oldValues),
            NewValues = newValues is null ? null : JsonSerializer.Serialize(newValues),
            IpAddress = currentUser.IpAddress,
            UserAgent = currentUser.UserAgent
        };

        await context.AuditLogs.AddAsync(log, ct);
        await context.SaveChangesAsync(ct);
    }
}
