namespace HospitalSystem.Application.Auth.DTOs;

public record LoginResultDto(
    bool MfaRequired,
    string? MfaChallengeToken,
    string? AccessToken,
    DateTimeOffset? AccessTokenExpiresAtUtc,
    UserProfileDto? User);

public record UserProfileDto(Guid Id, string Email, string FullName, IReadOnlyList<string> Roles, bool MfaEnabled);

public record RefreshResultDto(string AccessToken, DateTimeOffset AccessTokenExpiresAtUtc);

public record MfaSetupDto(string Secret, string OtpAuthUri);
