using HospitalSystem.Application.Appointments.DTOs;

namespace HospitalSystem.Application.Common.Interfaces;

/// <summary>Abstraction over the SignalR hub so Application handlers can push real-time updates without depending on ASP.NET Core hosting types.</summary>
public interface IAppointmentNotifier
{
    /// <summary>patientUserId is the Identity user id (not the Patient/Appointment domain id) —
    /// that's what clients actually join their private SignalR group by.</summary>
    Task NotifyAppointmentCreatedAsync(AppointmentDto appointment, Guid patientUserId, CancellationToken ct = default);
    Task NotifyAppointmentUpdatedAsync(AppointmentDto appointment, Guid patientUserId, CancellationToken ct = default);
    Task NotifyAppointmentCancelledAsync(Guid appointmentId, Guid patientUserId, CancellationToken ct = default);

    /// <summary>Pushes a live "NotificationCreated" event to one user's private SignalR group,
    /// so the notification bell updates instantly instead of waiting for the next poll.</summary>
    Task NotifyUserAsync(Guid userId, string title, string message, CancellationToken ct = default);
}
