using Asp.Versioning;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Application.Doctors.Commands;
using HospitalSystem.Application.Doctors.DTOs;
using HospitalSystem.Application.Doctors.Queries;
using HospitalSystem.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HospitalSystem.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/doctors")]
[Authorize]
[EnableRateLimiting("api")]
public class DoctorsController(ISender mediator) : ControllerBase
{
    /// <summary>GET /api/v1/doctors?specialty=...&amp;activeOnly=true&amp;page=1&amp;pageSize=20 — cached read-heavy list.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<DoctorDto>>> GetDoctors(
        [FromQuery] PaginationQuery pagination, [FromQuery] string? specialty, [FromQuery] bool activeOnly = true, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetDoctorsQuery(pagination, specialty, activeOnly), ct);
        return Ok(result);
    }

    /// <summary>GET /api/v1/doctors/{id}/available-slots?date=2026-08-01 — one round trip covering the whole day.</summary>
    [HttpGet("{id:guid}/available-slots")]
    public async Task<ActionResult<IReadOnlyList<FreeSlotDto>>> GetAvailableSlots(Guid id, [FromQuery] DateOnly date, CancellationToken ct)
    {
        var result = await mediator.Send(new GetDoctorAvailableSlotsQuery(id, date), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<DoctorDto>> Create(CreateDoctorCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetDoctors), new { version = "1.0" }, result);
    }
}
