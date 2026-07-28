namespace HospitalSystem.Application.Common.Interfaces;

public record AccessTokenResult(string AccessToken, DateTimeOffset ExpiresAtUtc);
public record RefreshTokenResult(string RawToken, DateTimeOffset AbsoluteExpiresAtUtc);

public interface ITokenService
{
    AccessTokenResult GenerateAccessToken(Guid userId, string email, IReadOnlyList<string> roles);

    /// <summary>Creates and persists a new refresh token; the raw value is returned once and never stored.</summary>
    Task<RefreshTokenResult> IssueRefreshTokenAsync(Guid userId, string ipAddress, CancellationToken ct = default);

    /// <summary>
    /// Validates the raw refresh token against its stored hash, enforces the idle-timeout window,
    /// revokes it, and rotates in a replacement (rotation-on-use) — the mechanism behind auto-logout
    /// for inactive sessions: once idle longer than the sliding window, this returns null and the
    /// caller must sign in again.
    /// </summary>
    Task<(Guid userId, RefreshTokenResult newToken)?> ValidateAndRotateAsync(string rawToken, string ipAddress, CancellationToken ct = default);

    Task RevokeAsync(string rawToken, string ipAddress, CancellationToken ct = default);

    /// <summary>Short-lived (5 min), single-purpose token binding a login attempt to its second MFA factor.</summary>
    string GenerateMfaChallengeToken(Guid userId);
    Guid? ValidateMfaChallengeToken(string challengeToken);
}
