namespace HospitalSystem.Infrastructure.Services;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;

    /// <summary>Symmetric signing key, min 32 bytes. Load from user-secrets/environment, never commit a real one.</summary>
    public string Secret { get; set; } = string.Empty;

    /// <summary>Short-lived by design: a stolen access token becomes useless within minutes.</summary>
    public int AccessTokenMinutes { get; set; } = 15;

    /// <summary>Hard cap on a refresh token's life, even if used continuously.</summary>
    public int RefreshTokenAbsoluteDays { get; set; } = 7;

    /// <summary>Sliding idle-timeout: if the refresh token isn't used within this window, the session
    /// is treated as abandoned and the next refresh attempt fails, forcing re-authentication.</summary>
    public int RefreshTokenIdleMinutes { get; set; } = 30;
}
