using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Entities;
using HospitalSystem.Domain.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace HospitalSystem.Infrastructure.Services;

public class TokenService(IOptions<JwtSettings> jwtOptions, IRefreshTokenRepository refreshTokens) : ITokenService
{
    private readonly JwtSettings _settings = jwtOptions.Value;

    public AccessTokenResult GenerateAccessToken(Guid userId, string email, IReadOnlyList<string> roles)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var expires = DateTimeOffset.UtcNow.AddMinutes(_settings.AccessTokenMinutes);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expires.UtcDateTime,
            signingCredentials: creds);

        return new AccessTokenResult(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public async Task<RefreshTokenResult> IssueRefreshTokenAsync(Guid userId, string ipAddress, CancellationToken ct = default)
    {
        var raw = GenerateSecureRandomToken();
        var absoluteExpiry = DateTimeOffset.UtcNow.AddDays(_settings.RefreshTokenAbsoluteDays);

        var entity = new RefreshToken
        {
            UserId = userId,
            TokenHash = Hash(raw),
            AbsoluteExpiresAtUtc = absoluteExpiry,
            LastUsedAtUtc = DateTimeOffset.UtcNow,
            CreatedByIp = ipAddress
        };

        await refreshTokens.AddAsync(entity, ct);
        await refreshTokens.SaveChangesAsync(ct);

        return new RefreshTokenResult(raw, absoluteExpiry);
    }

    public async Task<(Guid userId, RefreshTokenResult newToken)?> ValidateAndRotateAsync(string rawToken, string ipAddress, CancellationToken ct = default)
    {
        var existing = await refreshTokens.GetByTokenHashAsync(Hash(rawToken), ct);
        if (existing is null || !existing.IsActive)
            return null;

        var idleDeadline = existing.LastUsedAtUtc.AddMinutes(_settings.RefreshTokenIdleMinutes);
        if (idleDeadline < DateTimeOffset.UtcNow)
        {
            existing.RevokedAtUtc = DateTimeOffset.UtcNow;
            existing.RevokedByIp = ipAddress;
            await refreshTokens.SaveChangesAsync(ct);
            return null;
        }

        var newRaw = GenerateSecureRandomToken();
        var newHash = Hash(newRaw);

        existing.RevokedAtUtc = DateTimeOffset.UtcNow;
        existing.RevokedByIp = ipAddress;
        existing.ReplacedByTokenHash = newHash;

        var replacement = new RefreshToken
        {
            UserId = existing.UserId,
            TokenHash = newHash,
            AbsoluteExpiresAtUtc = existing.AbsoluteExpiresAtUtc,
            LastUsedAtUtc = DateTimeOffset.UtcNow,
            CreatedByIp = ipAddress
        };

        await refreshTokens.AddAsync(replacement, ct);
        await refreshTokens.SaveChangesAsync(ct);

        return (existing.UserId, new RefreshTokenResult(newRaw, replacement.AbsoluteExpiresAtUtc));
    }

    public async Task RevokeAsync(string rawToken, string ipAddress, CancellationToken ct = default)
    {
        var existing = await refreshTokens.GetByTokenHashAsync(Hash(rawToken), ct);
        if (existing is null || !existing.IsActive) return;

        existing.RevokedAtUtc = DateTimeOffset.UtcNow;
        existing.RevokedByIp = ipAddress;
        await refreshTokens.SaveChangesAsync(ct);
    }

    public string GenerateMfaChallengeToken(Guid userId)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new("purpose", "mfa_challenge")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public Guid? ValidateMfaChallengeToken(string challengeToken)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        // Without this, JwtSecurityTokenHandler silently remaps the short "sub" claim to the long
        // ClaimTypes.NameIdentifier URI, which would make the JwtRegisteredClaimNames.Sub lookup below return null.
        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };

        try
        {
            var principal = handler.ValidateToken(challengeToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _settings.Issuer,
                ValidateAudience = true,
                ValidAudience = _settings.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30)
            }, out _);

            var purpose = principal.FindFirstValue("purpose");
            if (purpose != "mfa_challenge") return null;

            var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(sub, out var id) ? id : null;
        }
        catch (Exception ex) when (ex is SecurityTokenException or ArgumentException)
        {
            return null;
        }
    }

    private static string GenerateSecureRandomToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    private static string Hash(string raw) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
}
