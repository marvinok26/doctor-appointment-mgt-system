using HospitalSystem.Domain.Enums;

namespace HospitalSystem.Application.Common.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        AuditAction action,
        string entityName,
        string? entityId = null,
        object? oldValues = null,
        object? newValues = null,
        Guid? userId = null,
        string? userEmail = null,
        CancellationToken ct = default);
}
