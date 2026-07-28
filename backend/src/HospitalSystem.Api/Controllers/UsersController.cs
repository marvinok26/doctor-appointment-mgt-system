using Asp.Versioning;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Application.Users.Commands;
using HospitalSystem.Application.Users.DTOs;
using HospitalSystem.Application.Users.Queries;
using HospitalSystem.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HospitalSystem.Api.Controllers;

/// <summary>Admin-only account directory and lockout control.</summary>
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/users")]
[Authorize(Roles = Roles.Admin)]
[EnableRateLimiting("api")]
public class UsersController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<UserSummaryDto>>> GetUsers(
        [FromQuery] PaginationQuery pagination, [FromQuery] string? search, [FromQuery] string? role, CancellationToken ct)
    {
        var result = await mediator.Send(new GetUsersQuery(pagination, search, role), ct);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/lockout")]
    public async Task<IActionResult> SetLockout(Guid id, [FromBody] SetLockoutRequest request, CancellationToken ct)
    {
        await mediator.Send(new SetUserLockoutCommand(id, request.Locked), ct);
        return NoContent();
    }
}

public record SetLockoutRequest(bool Locked);
