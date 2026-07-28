using FluentValidation;
using HospitalSystem.Application.Auth.DTOs;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Exceptions;
using MediatR;

namespace HospitalSystem.Application.Auth.Commands;

public record GenerateMfaSetupCommand(Guid UserId, string Email) : IRequest<MfaSetupDto>;

public class GenerateMfaSetupCommandHandler(IIdentityService identityService) : IRequestHandler<GenerateMfaSetupCommand, MfaSetupDto>
{
    private const string Issuer = "HospitalSystem";

    public async Task<MfaSetupDto> Handle(GenerateMfaSetupCommand request, CancellationToken ct)
    {
        var secret = await identityService.GenerateMfaSetupSecretAsync(request.UserId, ct);
        var uri = $"otpauth://totp/{Issuer}:{Uri.EscapeDataString(request.Email)}?secret={secret}&issuer={Issuer}&digits=6&period=30";
        return new MfaSetupDto(secret, uri);
    }
}

public record ConfirmMfaSetupCommand(Guid UserId, string Code) : IRequest;

public class ConfirmMfaSetupCommandValidator : AbstractValidator<ConfirmMfaSetupCommand>
{
    public ConfirmMfaSetupCommandValidator() =>
        RuleFor(x => x.Code).NotEmpty().Length(6).Matches("^[0-9]{6}$");
}

public class ConfirmMfaSetupCommandHandler(IIdentityService identityService, IAuditService auditService)
    : IRequestHandler<ConfirmMfaSetupCommand>
{
    public async Task Handle(ConfirmMfaSetupCommand request, CancellationToken ct)
    {
        var enabled = await identityService.VerifyAndEnableMfaAsync(request.UserId, request.Code, ct);
        if (!enabled)
            throw new DomainException("Invalid authentication code. MFA was not enabled.");

        await auditService.LogAsync(Domain.Enums.AuditAction.MfaEnabled, "User", request.UserId.ToString(), userId: request.UserId, ct: ct);
    }
}
