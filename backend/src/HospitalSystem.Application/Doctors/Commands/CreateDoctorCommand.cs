using FluentValidation;
using Ganss.Xss;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Application.Doctors.DTOs;
using HospitalSystem.Domain.Entities;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Exceptions;
using HospitalSystem.Domain.Interfaces;
using MediatR;

namespace HospitalSystem.Application.Doctors.Commands;

/// <summary>Admin-only: provisions both the Identity login and the Doctor domain record together.</summary>
public record CreateDoctorCommand(
    string Email,
    string FullName,
    string TemporaryPassword,
    string Specialty,
    string LicenseNumber,
    string? Bio) : IRequest<DoctorDto>;

public class CreateDoctorCommandValidator : AbstractValidator<CreateDoctorCommand>
{
    public CreateDoctorCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TemporaryPassword).NotEmpty().MinimumLength(10);
        RuleFor(x => x.Specialty).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LicenseNumber).NotEmpty().MaximumLength(50);
    }
}

public class CreateDoctorCommandHandler(IIdentityService identityService, IUnitOfWork unitOfWork, ICacheService cache)
    : IRequestHandler<CreateDoctorCommand, DoctorDto>
{
    // Bio is the one field in the system rendered as trusted HTML (dangerouslySetInnerHTML on the
    // frontend, via the RichTextEditor/Tiptap Bio field). Only Admins can set it today, but every
    // authenticated user views it on the doctor list, so it's sanitized server-side regardless —
    // defense in depth against a compromised admin session or a future relaxation of who can write it.
    private static readonly HtmlSanitizer BioSanitizer = new(new HtmlSanitizerOptions
    {
        AllowedTags = new HashSet<string> { "p", "br", "strong", "b", "em", "i", "ul", "ol", "li" }
    });

    public async Task<DoctorDto> Handle(CreateDoctorCommand request, CancellationToken ct)
    {
        var existing = await identityService.FindByEmailAsync(request.Email, ct);
        if (existing is not null)
            throw new DomainException("An account with this email already exists.");

        var identityResult = await identityService.CreateUserAsync(request.Email, request.FullName, request.TemporaryPassword, Roles.Doctor, ct);
        if (!identityResult.Succeeded)
            throw new DomainException(string.Join(" ", identityResult.Errors));

        var doctor = new Doctor
        {
            UserId = identityResult.UserId!.Value,
            FullName = request.FullName,
            Specialty = request.Specialty,
            LicenseNumber = request.LicenseNumber,
            Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : BioSanitizer.Sanitize(request.Bio)
        };

        await unitOfWork.Doctors.AddAsync(doctor, ct);
        await unitOfWork.SaveChangesAsync(ct);
        await cache.RemoveByPrefixAsync("doctors:list", ct);

        return new DoctorDto(doctor.Id, doctor.FullName, doctor.Specialty, doctor.Bio, doctor.IsActive);
    }
}
