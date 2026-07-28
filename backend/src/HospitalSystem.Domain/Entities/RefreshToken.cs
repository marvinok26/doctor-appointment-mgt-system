using HospitalSystem.Domain.Common;

namespace HospitalSystem.Domain.Entities;

/// <summary>
/// Stores only the SHA-256 hash of the refresh token, never the raw value.
/// LastUsedAtUtc backs the idle-timeout (sliding expiration) logout policy;
/// AbsoluteExpiresAtUtc backs the hard cap regardless of activity.
/// </summary>
public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset AbsoluteExpiresAtUtc { get; set; }
    public DateTimeOffset LastUsedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public string CreatedByIp { get; set; } = string.Empty;
    public string? RevokedByIp { get; set; }

    public bool IsActive => RevokedAtUtc is null && AbsoluteExpiresAtUtc > DateTimeOffset.UtcNow;
}
