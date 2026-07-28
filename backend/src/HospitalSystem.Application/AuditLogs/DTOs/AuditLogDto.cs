using HospitalSystem.Domain.Enums;

namespace HospitalSystem.Application.AuditLogs.DTOs;

public record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string? UserEmail,
    AuditAction Action,
    string EntityName,
    string? EntityId,
    string? OldValues,
    string? NewValues,
    string IpAddress,
    DateTimeOffset CreatedAtUtc);
