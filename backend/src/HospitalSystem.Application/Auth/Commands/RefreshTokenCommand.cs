using HospitalSystem.Application.Auth.DTOs;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Exceptions;
using MediatR;

namespace HospitalSystem.Application.Auth.Commands;

/// <summary>
/// Called silently by the frontend's API client whenever a request gets a 401.
/// If the refresh token has gone idle past its sliding window (or was revoked), this throws
/// and the frontend forces the user back to the login screen — the inactivity auto-logout.
/// </summary>
public record RefreshTokenCommand(string RawRefreshToken, string IpAddress) : IRequest<(RefreshResultDto Response, string NewRawRefreshToken, DateTimeOffset NewExpiresAtUtc)>;

public class RefreshTokenCommandHandler(ITokenService tokenService, IIdentityService identityService)
    : IRequestHandler<RefreshTokenCommand, (RefreshResultDto, string, DateTimeOffset)>
{
    public async Task<(RefreshResultDto, string, DateTimeOffset)> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var result = await tokenService.ValidateAndRotateAsync(request.RawRefreshToken, request.IpAddress, ct)
            ?? throw new DomainException("Session expired due to inactivity. Please sign in again.");

        var user = await identityService.FindByIdAsync(result.userId, ct)
            ?? throw new NotFoundException("User", result.userId);

        var access = tokenService.GenerateAccessToken(user.Id, user.Email, user.Roles);
        return (new RefreshResultDto(access.AccessToken, access.ExpiresAtUtc), result.newToken.RawToken, result.newToken.AbsoluteExpiresAtUtc);
    }
}
