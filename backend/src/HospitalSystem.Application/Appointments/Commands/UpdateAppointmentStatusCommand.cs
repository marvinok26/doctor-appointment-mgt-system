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

/// <summary>Allowed forward transitions; prevents e.g. resurrecting a Cancelled appointment as Completed.</summary>
public static class AppointmentStatusTransitions
{
    private static readonly Dictionary<AppointmentStatus, AppointmentStatus[]> Allowed = new()
    {
        [AppointmentStatus.Requested] = [AppointmentStatus.Confirmed, AppointmentStatus.Cancelled],
        [AppointmentStatus.Confirmed] = [AppointmentStatus.CheckedIn, AppointmentStatus.Cancelled, AppointmentStatus.NoShow],
        [AppointmentStatus.CheckedIn] = [AppointmentStatus.Completed],
        [AppointmentStatus.Completed] = [],
        [AppointmentStatus.Cancelled] = [],
        [AppointmentStatus.NoShow] = []
    };

    public static bool CanTransition(AppointmentStatus from, AppointmentStatus to) => Allowed[from].Contains(to);
}

public record UpdateAppointmentStatusCommand(Guid AppointmentId, AppointmentStatus NewStatus, string? Notes) : IRequest<AppointmentDto>;

public class UpdateAppointmentStatusCommandValidator : AbstractValidator<UpdateAppointmentStatusCommand>
{
    public UpdateAppointmentStatusCommandValidator()
    {
        RuleFor(x => x.AppointmentId).NotEmpty();
        RuleFor(x => x.NewStatus).IsInEnum();
        RuleFor(x => x.Notes).MaximumLength(2000);
    }
}

public class UpdateAppointmentStatusCommandHandler(
    IUnitOfWork unitOfWork,
    IAppointmentNotifier notifier,
    IAuditService auditService) : IRequestHandler<UpdateAppointmentStatusCommand, AppointmentDto>
{
    public async Task<AppointmentDto> Handle(UpdateAppointmentStatusCommand request, CancellationToken ct)
    {
        var appointment = await unitOfWork.Appointments.Query()
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, ct)
            ?? throw new NotFoundException(nameof(Appointment), request.AppointmentId);

        if (!AppointmentStatusTransitions.CanTransition(appointment.Status, request.NewStatus))
            throw new DomainException($"Cannot move an appointment from {appointment.Status} to {request.NewStatus}.");

        var oldStatus = appointment.Status;
        appointment.Status = request.NewStatus;
        if (request.Notes is not null) appointment.Notes = request.Notes;
        appointment.ModifiedAtUtc = DateTimeOffset.UtcNow;

        unitOfWork.Appointments.Update(appointment);

        await unitOfWork.Notifications.AddAsync(new Notification
        {
            RecipientUserId = appointment.Patient!.UserId,
            Title = "Appointment update",
            Message = $"Your appointment with Dr. {appointment.Doctor!.FullName} is now {request.NewStatus}.",
            RelatedAppointmentId = appointment.Id
        }, ct);

        await unitOfWork.SaveChangesAsync(ct);

        var dto = new AppointmentDto(
            appointment.Id, appointment.DoctorId, appointment.Doctor!.FullName, appointment.Doctor.Specialty,
            appointment.PatientId, appointment.Patient!.FullName,
            appointment.ScheduledStartUtc, appointment.ScheduledEndUtc,
            appointment.Status, appointment.Reason, appointment.Notes, appointment.CreatedAtUtc);

        await notifier.NotifyAppointmentUpdatedAsync(dto, appointment.Patient!.UserId, ct);
        await notifier.NotifyUserAsync(appointment.Patient.UserId, "Appointment update", $"Your appointment is now {request.NewStatus}.", ct);
        await auditService.LogAsync(AuditAction.Update, nameof(Appointment), appointment.Id.ToString(),
            oldValues: new { Status = oldStatus }, newValues: new { Status = appointment.Status }, ct: ct);

        return dto;
    }
}
