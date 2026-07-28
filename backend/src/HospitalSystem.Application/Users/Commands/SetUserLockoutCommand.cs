using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Enums;
using MediatR;

namespace HospitalSystem.Application.Users.Commands;

public record SetUserLockoutCommand(Guid UserId, bool Locked) : IRequest;

public class SetUserLockoutCommandHandler(IIdentityService identityService, IAuditService auditService) : IRequestHandler<SetUserLockoutCommand>
{
    public async Task Handle(SetUserLockoutCommand request, CancellationToken ct)
    {
        await identityService.SetLockoutAsync(request.UserId, request.Locked, ct);
        await auditService.LogAsync(AuditAction.Update, "User", request.UserId.ToString(),
            newValues: new { Locked = request.Locked }, ct: ct);
    }
}
