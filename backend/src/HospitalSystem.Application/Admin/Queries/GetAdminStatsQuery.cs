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
        var totalDoctorsTask = unitOfWork.Doctors.Query().CountAsync(ct);
        var totalPatientsTask = unitOfWork.Patients.Query().CountAsync(ct);
        var totalUsersTask = identityService.CountAllUsersAsync(ct);

        var appointmentsByStatusTask = unitOfWork.Appointments.Query()
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var today = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero);
        var appointmentsTodayTask = unitOfWork.Appointments.Query()
            .CountAsync(a => a.ScheduledStartUtc >= today && a.ScheduledStartUtc < today.AddDays(1), ct);

        var roleCountTasks = Roles.All.Select(async role => (Role: role, Count: await identityService.CountUsersInRoleAsync(role, ct)));

        await Task.WhenAll(totalDoctorsTask, totalPatientsTask, totalUsersTask, appointmentsByStatusTask, appointmentsTodayTask);
        var roleCounts = await Task.WhenAll(roleCountTasks);

        return new AdminStatsDto(
            await totalUsersTask,
            await totalDoctorsTask,
            await totalPatientsTask,
            roleCounts.ToDictionary(r => r.Role, r => r.Count),
            (await appointmentsByStatusTask).ToDictionary(x => x.Status.ToString(), x => x.Count),
            await appointmentsTodayTask);
    }
}
