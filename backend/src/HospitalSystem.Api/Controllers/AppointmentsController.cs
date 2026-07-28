using Asp.Versioning;
using HospitalSystem.Application.Appointments.Commands;
using HospitalSystem.Application.Appointments.DTOs;
using HospitalSystem.Application.Appointments.Queries;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Exceptions;
using HospitalSystem.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Api.Controllers;

/// <summary>
/// Resources are plural nouns (/appointments), list endpoints uniformly support pagination,
/// sorting and filtering via query string, and every route is versioned under /api/v1.
/// Access is scoped per role: a Patient only ever sees their own records; Doctor sees their
/// schedule; Receptionist/Admin see everything and can act on behalf of a patient.
/// </summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/appointments")]
[Authorize]
[EnableRateLimiting("api")]
public class AppointmentsController(ISender mediator, IUnitOfWork unitOfWork, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<AppointmentDto>>> GetAppointments(
        [FromQuery] PaginationQuery pagination,
        [FromQuery] AppointmentStatus? status,
        [FromQuery] DateTimeOffset? fromUtc,
        [FromQuery] DateTimeOffset? toUtc,
        [FromQuery] Guid? doctorId,
        CancellationToken ct)
    {
        Guid? scopedDoctorId = doctorId;
        Guid? scopedPatientId = null;

        if (currentUser.IsInRole(Roles.Patient))
        {
            scopedPatientId = await ResolveOwnPatientIdAsync(ct);
            scopedDoctorId = null;
        }
        else if (currentUser.IsInRole(Roles.Doctor) && !currentUser.IsInRole(Roles.Admin))
        {
            scopedDoctorId = await ResolveOwnDoctorIdAsync(ct);
        }

        var result = await mediator.Send(new GetAppointmentsQuery(pagination, scopedDoctorId, scopedPatientId, status, fromUtc, toUtc), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AppointmentDto>> GetById(Guid id, CancellationToken ct)
    {
        var appointment = await mediator.Send(new GetAppointmentByIdQuery(id), ct);
        if (!await CanAccessAsync(appointment, ct)) return Forbid();
        return Ok(appointment);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> Create(CreateAppointmentRequest request, CancellationToken ct)
    {
        var patientId = request.PatientId;

        if (currentUser.IsInRole(Roles.Patient))
        {
            patientId = await ResolveOwnPatientIdAsync(ct);
        }
        else if (patientId is null)
        {
            return BadRequest(new { message = "patientId is required when booking on behalf of a patient." });
        }

        var command = new CreateAppointmentCommand(request.DoctorId, patientId!.Value, request.ScheduledStartUtc, request.ScheduledEndUtc, request.Reason);
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id, version = "1.0" }, result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{Roles.Doctor},{Roles.Receptionist},{Roles.Admin}")]
    public async Task<ActionResult<AppointmentDto>> UpdateStatus(Guid id, UpdateAppointmentStatusRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateAppointmentStatusCommand(id, request.Status, request.Notes), ct);
        return Ok(result);
    }

    private async Task<bool> CanAccessAsync(AppointmentDto appointment, CancellationToken ct)
    {
        if (currentUser.IsInRole(Roles.Admin) || currentUser.IsInRole(Roles.Receptionist)) return true;

        if (currentUser.IsInRole(Roles.Patient))
            return appointment.PatientId == await ResolveOwnPatientIdAsync(ct);

        if (currentUser.IsInRole(Roles.Doctor))
            return appointment.DoctorId == await ResolveOwnDoctorIdAsync(ct);

        return false;
    }

    private async Task<Guid> ResolveOwnPatientIdAsync(CancellationToken ct)
    {
        var patient = await unitOfWork.Patients.Query().FirstOrDefaultAsync(p => p.UserId == currentUser.UserId, ct)
            ?? throw new NotFoundException("Patient profile", currentUser.UserId ?? Guid.Empty);
        return patient.Id;
    }

    private async Task<Guid> ResolveOwnDoctorIdAsync(CancellationToken ct)
    {
        var doctor = await unitOfWork.Doctors.Query().FirstOrDefaultAsync(d => d.UserId == currentUser.UserId, ct)
            ?? throw new NotFoundException("Doctor profile", currentUser.UserId ?? Guid.Empty);
        return doctor.Id;
    }
}

public record CreateAppointmentRequest(Guid DoctorId, Guid? PatientId, DateTimeOffset ScheduledStartUtc, DateTimeOffset ScheduledEndUtc, string Reason);
public record UpdateAppointmentStatusRequest(AppointmentStatus Status, string? Notes);
