using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Api.BackgroundServices;

/// <summary>
/// Polls every minute for confirmed appointments starting within the next 24 hours that haven't
/// had a reminder sent, and emails the patient — kept off the request path entirely so booking an
/// appointment never waits on SMTP. Each scoped DbContext is fetched per tick since hosted services
/// are singletons but EF Core contexts are not thread-safe/long-lived.
/// </summary>
public class AppointmentReminderService(IServiceScopeFactory scopeFactory, ILogger<AppointmentReminderService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan ReminderWindow = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        do
        {
            try
            {
                await SendDueRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Appointment reminder sweep failed.");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task SendDueRemindersAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var identityService = scope.ServiceProvider.GetRequiredService<IIdentityService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var notifier = scope.ServiceProvider.GetRequiredService<IAppointmentNotifier>();

        var cutoff = DateTimeOffset.UtcNow.Add(ReminderWindow);

        var due = await unitOfWork.Appointments.Query()
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .Where(a => !a.ReminderSent
                && a.Status == AppointmentStatus.Confirmed
                && a.ScheduledStartUtc <= cutoff
                && a.ScheduledStartUtc > DateTimeOffset.UtcNow)
            .ToListAsync(ct);

        foreach (var appointment in due)
        {
            var patientAccount = await identityService.FindByIdAsync(appointment.Patient!.UserId, ct);
            if (patientAccount is not null)
            {
                var body = $"""
                    <p>Hi {appointment.Patient.FullName},</p>
                    <p>This is a reminder that you have an appointment with Dr. {appointment.Doctor!.FullName}
                    ({appointment.Doctor.Specialty}) on {appointment.ScheduledStartUtc:f} UTC.</p>
                    <p>Reason: {appointment.Reason}</p>
                    """;

                await emailService.SendAsync(patientAccount.Email, "Appointment Reminder", body, ct);
            }

            await unitOfWork.Notifications.AddAsync(new Domain.Entities.Notification
            {
                RecipientUserId = appointment.Patient!.UserId,
                Title = "Upcoming appointment reminder",
                Message = $"Your appointment with Dr. {appointment.Doctor!.FullName} is on {appointment.ScheduledStartUtc:f} UTC.",
                RelatedAppointmentId = appointment.Id
            }, ct);

            await notifier.NotifyUserAsync(appointment.Patient.UserId, "Upcoming appointment reminder",
                $"Your appointment with Dr. {appointment.Doctor.FullName} is on {appointment.ScheduledStartUtc:f} UTC.", ct);

            appointment.ReminderSent = true;
            unitOfWork.Appointments.Update(appointment);
        }

        if (due.Count > 0)
            await unitOfWork.SaveChangesAsync(ct);
    }
}
