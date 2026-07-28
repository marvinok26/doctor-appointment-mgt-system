using Asp.Versioning;
using HospitalSystem.Application.Auth.Commands;
using HospitalSystem.Application.Auth.DTOs;
using HospitalSystem.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HospitalSystem.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
[EnableRateLimiting("auth")]
public class AuthController(ISender mediator, IIdentityService identityService) : ControllerBase
{
    private const string RefreshCookieName = "refreshToken";

    /// <summary>POST /api/v1/auth/register — 201 with the created profile.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<UserProfileDto>> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new RegisterCommand(request.Email, request.FullName, request.Password, request.DateOfBirth, request.PhoneNumber), ct);
        return CreatedAtAction(nameof(Register), new { }, result);
    }

    /// <summary>POST /api/v1/auth/login — 200 with either an access token or an MFA challenge.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResultDto>> Login(LoginRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var result = await mediator.Send(new LoginCommand(request.Email, request.Password, ip, Request.Headers.UserAgent.ToString()), ct);

        if (result.RawRefreshToken is not null)
            SetRefreshCookie(result.RawRefreshToken, result.RefreshTokenExpiresAtUtc!.Value);

        return Ok(result.Response);
    }

    /// <summary>POST /api/v1/auth/mfa/verify — completes login after a successful password check.</summary>
    [HttpPost("mfa/verify")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResultDto>> VerifyMfa(VerifyMfaRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var result = await mediator.Send(new VerifyMfaCommand(request.ChallengeToken, request.Code, ip), ct);

        if (result.RawRefreshToken is not null)
            SetRefreshCookie(result.RawRefreshToken, result.RefreshTokenExpiresAtUtc!.Value);

        return Ok(result.Response);
    }

    /// <summary>
    /// POST /api/v1/auth/refresh — the frontend calls this whenever an access token expires or a
    /// request 401s. Reads the refresh token only from the httpOnly cookie (never from the body),
    /// which is also what makes this endpoint immune to CSRF: a forged cross-site request can carry
    /// the cookie automatically, but SameSite=Strict/Lax on the cookie stops it from being sent on
    /// cross-origin requests in the first place, and the response is useless to an attacker anyway
    /// since it can't be read cross-origin (CORS blocks the response body).
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<RefreshResultDto>> Refresh(CancellationToken ct)
    {
        var rawToken = Request.Cookies[RefreshCookieName];
        if (string.IsNullOrEmpty(rawToken))
            return Unauthorized(new { message = "No active session." });

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (response, newRawToken, newExpiry) = await mediator.Send(new RefreshTokenCommand(rawToken, ip), ct);

        SetRefreshCookie(newRawToken, newExpiry);
        return Ok(response);
    }

    /// <summary>POST /api/v1/auth/logout — 204, revokes the refresh token and clears the cookie.</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var rawToken = Request.Cookies[RefreshCookieName];
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrEmpty(rawToken))
            await mediator.Send(new LogoutCommand(rawToken, ip, Guid.TryParse(userId, out var id) ? id : null), ct);

        Response.Cookies.Delete(RefreshCookieName);
        return NoContent();
    }

    /// <summary>GET /api/v1/auth/me — used by the frontend right after a silent token refresh to rehydrate the profile.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileDto>> Me(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var user = await identityService.FindByIdAsync(userId, ct);
        if (user is null) return NotFound();

        return Ok(new UserProfileDto(user.Id, user.Email, user.FullName, user.Roles, user.MfaEnabled));
    }

    [HttpPost("mfa/setup")]
    [Authorize]
    public async Task<ActionResult<MfaSetupDto>> SetupMfa(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)!.Value;
        var result = await mediator.Send(new GenerateMfaSetupCommand(userId, email), ct);
        return Ok(result);
    }

    [HttpPost("mfa/confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmMfa(ConfirmMfaRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await mediator.Send(new ConfirmMfaSetupCommand(userId, request.Code), ct);
        return NoContent();
    }

    private void SetRefreshCookie(string rawToken, DateTimeOffset expiresAtUtc)
    {
        Response.Cookies.Append(RefreshCookieName, rawToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = expiresAtUtc,
            Path = "/api/v1/auth"
        });
    }
}

public record RegisterRequest(string Email, string FullName, string Password, DateOnly DateOfBirth, string PhoneNumber);
public record LoginRequest(string Email, string Password);
public record VerifyMfaRequest(string ChallengeToken, string Code);
public record ConfirmMfaRequest(string Code);
