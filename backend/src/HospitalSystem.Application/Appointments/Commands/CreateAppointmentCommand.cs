using FluentValidation;
using HospitalSystem.Application.Appointments.DTOs;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Entities;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Exceptions;
using HospitalSystem.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Application.Appointments.Commands;

public record CreateAppointmentCommand(
    Guid DoctorId,
    Guid PatientId,
    DateTimeOffset ScheduledStartUtc,
    DateTimeOffset ScheduledEndUtc,
    string Reason) : IRequest<AppointmentDto>;

public class CreateAppointmentCommandValidator : AbstractValidator<CreateAppointmentCommand>
{
    public CreateAppointmentCommandValidator()
    {
        RuleFor(x => x.DoctorId).NotEmpty();
        RuleFor(x => x.PatientId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
        RuleFor(x => x.ScheduledStartUtc).GreaterThan(DateTimeOffset.UtcNow).WithMessage("Appointment must be scheduled in the future.");
        RuleFor(x => x.ScheduledEndUtc).GreaterThan(x => x.ScheduledStartUtc).WithMessage("End time must be after start time.");
        RuleFor(x => x)
            .Must(x => (x.ScheduledEndUtc - x.ScheduledStartUtc) <= TimeSpan.FromHours(4))
            .WithMessage("Appointments cannot exceed 4 hours.");
    }
}

public class CreateAppointmentCommandHandler(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAppointmentNotifier notifier,
    IAuditService auditService) : IRequestHandler<CreateAppointmentCommand, AppointmentDto>
{
    public async Task<AppointmentDto> Handle(CreateAppointmentCommand request, CancellationToken ct)
    {
        var doctor = await unitOfWork.Doctors.Query().FirstOrDefaultAsync(d => d.Id == request.DoctorId && d.IsActive, ct)
            ?? throw new NotFoundException(nameof(Doctor), request.DoctorId);

        var patient = await unitOfWork.Patients.GetByIdAsync(request.PatientId, ct)
            ?? throw new NotFoundException(nameof(Patient), request.PatientId);

        var hasConflict = await unitOfWork.Appointments.Query()
            .AnyAsync(a => a.DoctorId == request.DoctorId
                && a.Status != AppointmentStatus.Cancelled
                && a.ScheduledStartUtc < request.ScheduledEndUtc
                && request.ScheduledStartUtc < a.ScheduledEndUtc, ct);

        if (hasConflict)
            throw new SchedulingConflictException("The selected doctor already has an appointment overlapping this time slot.");

        var appointment = new Appointment
        {
            DoctorId = request.DoctorId,
            PatientId = request.PatientId,
            ScheduledStartUtc = request.ScheduledStartUtc,
            ScheduledEndUtc = request.ScheduledEndUtc,
            Reason = request.Reason,
            Status = AppointmentStatus.Requested
        };

        await unitOfWork.Appointments.AddAsync(appointment, ct);

        await unitOfWork.Notifications.AddAsync(new Notification
        {
            RecipientUserId = doctor.UserId,
            Title = "New appointment request",
            Message = $"{patient.FullName} requested an appointment on {appointment.ScheduledStartUtc:f} UTC.",
            RelatedAppointmentId = appointment.Id
        }, ct);

        await unitOfWork.SaveChangesAsync(ct);

        await cache.RemoveByPrefixAsync($"doctor-availability:{request.DoctorId}", ct);

        var dto = new AppointmentDto(
            appointment.Id, doctor.Id, doctor.FullName, doctor.Specialty,
            patient.Id, patient.FullName,
            appointment.ScheduledStartUtc, appointment.ScheduledEndUtc,
            appointment.Status, appointment.Reason, appointment.Notes, appointment.CreatedAtUtc);

        await notifier.NotifyAppointmentCreatedAsync(dto, patient.UserId, ct);
        await notifier.NotifyUserAsync(doctor.UserId, "New appointment request", $"{patient.FullName} requested an appointment.", ct);
        await auditService.LogAsync(AuditAction.Create, nameof(Appointment), appointment.Id.ToString(), newValues: dto, ct: ct);

        return dto;
    }
}
