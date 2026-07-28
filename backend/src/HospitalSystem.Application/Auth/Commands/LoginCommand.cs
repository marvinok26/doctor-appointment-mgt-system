using FluentValidation;
using HospitalSystem.Application.Auth.DTOs;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Exceptions;
using MediatR;

namespace HospitalSystem.Application.Auth.Commands;

/// <summary>Result carries the raw refresh token separately from the public DTO so the controller
/// can set it as an httpOnly cookie without it ever reaching a JSON body or client-side script.</summary>
public record LoginCommandResult(LoginResultDto Response, string? RawRefreshToken, DateTimeOffset? RefreshTokenExpiresAtUtc);

public record LoginCommand(string Email, string Password, string IpAddress, string? UserAgent) : IRequest<LoginCommandResult>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginCommandHandler(
    IIdentityService identityService,
    ITokenService tokenService,
    IAuditService auditService) : IRequestHandler<LoginCommand, LoginCommandResult>
{
    public async Task<LoginCommandResult> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await identityService.FindByEmailAsync(request.Email, ct);

        // Deliberately identical error for unknown-user and wrong-password to avoid leaking account existence.
        if (user is null || await identityService.IsLockedOutAsync(user.Id, ct))
        {
            await auditService.LogAsync(AuditAction.LoginFailed, "User", request.Email, ct: ct);
            throw new DomainException("Invalid email or password.");
        }

        var passwordValid = await identityService.CheckPasswordAsync(user.Id, request.Password, ct);
        if (!passwordValid)
        {
            await auditService.LogAsync(AuditAction.LoginFailed, "User", user.Id.ToString(), userId: user.Id, userEmail: user.Email, ct: ct);
            throw new DomainException("Invalid email or password.");
        }

        if (user.MfaEnabled)
        {
            var challengeToken = tokenService.GenerateMfaChallengeToken(user.Id);
            await auditService.LogAsync(AuditAction.MfaChallenge, "User", user.Id.ToString(), userId: user.Id, userEmail: user.Email, ct: ct);
            return new LoginCommandResult(
                new LoginResultDto(true, challengeToken, null, null, null),
                null,
                null);
        }

        return await IssueSessionAsync(user, request.IpAddress, ct);
    }

    internal async Task<LoginCommandResult> IssueSessionAsync(UserAccount user, string ipAddress, CancellationToken ct)
    {
        var access = tokenService.GenerateAccessToken(user.Id, user.Email, user.Roles);
        var refresh = await tokenService.IssueRefreshTokenAsync(user.Id, ipAddress, ct);

        await auditService.LogAsync(AuditAction.Login, "User", user.Id.ToString(), userId: user.Id, userEmail: user.Email, ct: ct);

        var profile = new UserProfileDto(user.Id, user.Email, user.FullName, user.Roles, user.MfaEnabled);
        var response = new LoginResultDto(false, null, access.AccessToken, access.ExpiresAtUtc, profile);
        return new LoginCommandResult(response, refresh.RawToken, refresh.AbsoluteExpiresAtUtc);
    }
}
