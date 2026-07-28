using FluentValidation;
using HospitalSystem.Application.Auth.DTOs;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Entities;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Exceptions;
using HospitalSystem.Domain.Interfaces;
using MediatR;

namespace HospitalSystem.Application.Auth.Commands;

/// <summary>Self-registration is restricted to the Patient role; staff accounts are provisioned by an Admin.</summary>
public record RegisterCommand(string Email, string FullName, string Password, DateOnly DateOfBirth, string PhoneNumber) : IRequest<UserProfileDto>;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.FullName)
            .NotEmpty()
            .Length(2, 50)
            .Matches("^[A-Za-z\\s-]+$").WithMessage("Full name may only contain letters, spaces and hyphens.");
        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .Matches(@"^\+[1-9]\d{7,14}$").WithMessage("Phone number must be in international E.164 format (e.g. +254712345678).");
        RuleFor(x => x.DateOfBirth).LessThan(DateOnly.FromDateTime(DateTime.UtcNow)).WithMessage("Date of birth must be in the past.");
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(10)
            .Matches("[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain a digit.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain a special character.");
    }
}

public class RegisterCommandHandler(IIdentityService identityService, IUnitOfWork unitOfWork)
    : IRequestHandler<RegisterCommand, UserProfileDto>
{
    public async Task<UserProfileDto> Handle(RegisterCommand request, CancellationToken ct)
    {
        var existing = await identityService.FindByEmailAsync(request.Email, ct);
        if (existing is not null)
            throw new DomainException("An account with this email already exists.");

        var result = await identityService.CreateUserAsync(request.Email, request.FullName, request.Password, Roles.Patient, ct);
        if (!result.Succeeded)
            throw new DomainException(string.Join(" ", result.Errors));

        var user = await identityService.FindByIdAsync(result.UserId!.Value, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Patient), result.UserId!.Value);

        await unitOfWork.Patients.AddAsync(new Patient
        {
            UserId = user.Id,
            FullName = request.FullName,
            DateOfBirth = request.DateOfBirth,
            PhoneNumber = request.PhoneNumber
        }, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new UserProfileDto(user.Id, user.Email, user.FullName, user.Roles, user.MfaEnabled);
    }
}
