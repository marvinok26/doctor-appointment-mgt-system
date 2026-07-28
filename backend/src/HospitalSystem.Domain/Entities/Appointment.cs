using HospitalSystem.Domain.Common;
using HospitalSystem.Domain.Enums;

namespace HospitalSystem.Domain.Entities;

public class Appointment : BaseEntity
{
    public Guid PatientId { get; set; }
    public Patient? Patient { get; set; }

    public Guid DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public DateTimeOffset ScheduledStartUtc { get; set; }
    public DateTimeOffset ScheduledEndUtc { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Requested;
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool ReminderSent { get; set; }

    /// <summary>Concurrency token to guard against double-booking races on the same slot.</summary>
    public byte[]? RowVersion { get; set; }
}
