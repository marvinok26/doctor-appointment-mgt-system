using HospitalSystem.Application.Appointments.DTOs;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Enums;
using Microsoft.AspNetCore.SignalR;

namespace HospitalSystem.Api.Hubs;

public class SignalRAppointmentNotifier(IHubContext<AppointmentHub> hub) : IAppointmentNotifier
{
    public Task NotifyAppointmentCreatedAsync(AppointmentDto appointment, Guid patientUserId, CancellationToken ct = default) =>
        BroadcastAsync("AppointmentCreated", appointment, patientUserId, ct);

    public Task NotifyAppointmentUpdatedAsync(AppointmentDto appointment, Guid patientUserId, CancellationToken ct = default) =>
        BroadcastAsync("AppointmentUpdated", appointment, patientUserId, ct);

    public async Task NotifyAppointmentCancelledAsync(Guid appointmentId, Guid patientUserId, CancellationToken ct = default)
    {
        await hub.Clients.Group($"role-{Roles.Doctor}").SendAsync("AppointmentCancelled", appointmentId, ct);
        await hub.Clients.Group($"role-{Roles.Receptionist}").SendAsync("AppointmentCancelled", appointmentId, ct);
        await hub.Clients.Group($"patient-{patientUserId}").SendAsync("AppointmentCancelled", appointmentId, ct);
    }

    public async Task NotifyUserAsync(Guid userId, string title, string message, CancellationToken ct = default)
    {
        await hub.Clients.Group($"patient-{userId}").SendAsync("NotificationCreated", new { title, message }, ct);
    }

    private async Task BroadcastAsync(string method, AppointmentDto appointment, Guid patientUserId, CancellationToken ct)
    {
        await hub.Clients.Group($"role-{Roles.Doctor}").SendAsync(method, appointment, ct);
        await hub.Clients.Group($"role-{Roles.Receptionist}").SendAsync(method, appointment, ct);
        await hub.Clients.Group($"patient-{patientUserId}").SendAsync(method, appointment, ct);
    }
}
