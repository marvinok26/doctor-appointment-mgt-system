using Asp.Versioning;
using HospitalSystem.Application.AuditLogs.DTOs;
using HospitalSystem.Application.AuditLogs.Queries;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HospitalSystem.Api.Controllers;

/// <summary>Admin-only visibility into who did what — the UI half of the audit logging requirement.</summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/audit-logs")]
[Authorize(Roles = Roles.Admin)]
[EnableRateLimiting("api")]
public class AuditLogsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> GetAuditLogs(
        [FromQuery] PaginationQuery pagination,
        [FromQuery] AuditAction? action,
        [FromQuery] Guid? userId,
        [FromQuery] DateTimeOffset? fromUtc,
        [FromQuery] DateTimeOffset? toUtc,
        CancellationToken ct)
    {
        var result = await mediator.Send(new GetAuditLogsQuery(pagination, action, userId, fromUtc, toUtc), ct);
        return Ok(result);
    }
}
