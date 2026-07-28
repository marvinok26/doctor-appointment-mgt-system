using HospitalSystem.Application.Admin.DTOs;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Application.Admin.Queries;

/// <summary>
/// One call backs the entire admin overview page — every number the dashboard needs collapsed
/// into a single round trip instead of five separate list-and-count requests.
/// </summary>
public record GetAdminStatsQuery : IRequest<AdminStatsDto>;

public class GetAdminStatsQueryHandler(IUnitOfWork unitOfWork, IIdentityService identityService)
    : IRequestHandler<GetAdminStatsQuery, AdminStatsDto>
{
    public async Task<AdminStatsDto> Handle(GetAdminStatsQuery request, CancellationToken ct)
    {
        // Sequential, not Task.WhenAll: every one of these shares the same scoped DbContext
        // (via IUnitOfWork/UserManager), and EF Core's DbContext throws on concurrent operations
        // from the same instance — this single round trip to the client is still one HTTP call,
        // it just can't fan out into parallel DB calls underneath.
        var totalDoctors = await unitOfWork.Doctors.Query().CountAsync(ct);
        var totalPatients = await unitOfWork.Patients.Query().CountAsync(ct);
        var totalUsers = await identityService.CountAllUsersAsync(ct);

        var appointmentsByStatus = await unitOfWork.Appointments.Query()
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var today = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero);
        var appointmentsToday = await unitOfWork.Appointments.Query()
            .CountAsync(a => a.ScheduledStartUtc >= today && a.ScheduledStartUtc < today.AddDays(1), ct);

        var usersByRole = new Dictionary<string, int>();
        foreach (var role in Roles.All)
            usersByRole[role] = await identityService.CountUsersInRoleAsync(role, ct);

        return new AdminStatsDto(
            totalUsers,
            totalDoctors,
            totalPatients,
            usersByRole,
            appointmentsByStatus.ToDictionary(x => x.Status.ToString(), x => x.Count),
            appointmentsToday);
    }
}
