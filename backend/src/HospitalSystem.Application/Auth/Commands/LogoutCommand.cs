using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Enums;
using MediatR;

namespace HospitalSystem.Application.Auth.Commands;

public record LogoutCommand(string RawRefreshToken, string IpAddress, Guid? UserId) : IRequest;

public class LogoutCommandHandler(ITokenService tokenService, IAuditService auditService) : IRequestHandler<LogoutCommand>
{
    public async Task Handle(LogoutCommand request, CancellationToken ct)
    {
        await tokenService.RevokeAsync(request.RawRefreshToken, request.IpAddress, ct);
        await auditService.LogAsync(AuditAction.Logout, "User", request.UserId?.ToString(), userId: request.UserId, ct: ct);
    }
}
