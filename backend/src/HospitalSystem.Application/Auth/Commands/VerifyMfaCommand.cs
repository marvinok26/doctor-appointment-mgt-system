using FluentValidation;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Exceptions;
using MediatR;

namespace HospitalSystem.Application.Auth.Commands;

public record VerifyMfaCommand(string ChallengeToken, string Code, string IpAddress) : IRequest<LoginCommandResult>;

public class VerifyMfaCommandValidator : AbstractValidator<VerifyMfaCommand>
{
    public VerifyMfaCommandValidator()
    {
        RuleFor(x => x.ChallengeToken).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().Length(6).Matches("^[0-9]{6}$").WithMessage("Code must be a 6-digit number.");
    }
}

public class VerifyMfaCommandHandler(
    ITokenService tokenService,
    IIdentityService identityService,
    LoginCommandHandler loginCommandHandler) : IRequestHandler<VerifyMfaCommand, LoginCommandResult>
{
    public async Task<LoginCommandResult> Handle(VerifyMfaCommand request, CancellationToken ct)
    {
        var userId = tokenService.ValidateMfaChallengeToken(request.ChallengeToken)
            ?? throw new DomainException("MFA challenge has expired. Please sign in again.");

        var codeValid = await identityService.VerifyMfaCodeAsync(userId, request.Code, ct);
        if (!codeValid)
            throw new DomainException("Invalid authentication code.");

        var user = await identityService.FindByIdAsync(userId, ct)
            ?? throw new NotFoundException("User", userId);

        return await loginCommandHandler.IssueSessionAsync(user, request.IpAddress, ct);
    }
}
