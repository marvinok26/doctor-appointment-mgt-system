using Asp.Versioning;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Application.Patients.DTOs;
using HospitalSystem.Application.Patients.Queries;
using HospitalSystem.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HospitalSystem.Api.Controllers;

/// <summary>Front-desk directory search — restricted to staff who need to look up a patient to book on their behalf.</summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/patients")]
[Authorize(Roles = $"{Roles.Receptionist},{Roles.Admin},{Roles.Doctor}")]
[EnableRateLimiting("api")]
public class PatientsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<PatientDto>>> GetPatients(
        [FromQuery] PaginationQuery pagination, [FromQuery] string? search, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPatientsQuery(pagination, search), ct);
        return Ok(result);
    }
}
