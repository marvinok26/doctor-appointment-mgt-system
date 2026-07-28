using HospitalSystem.Domain.Enums;

namespace HospitalSystem.Application.Appointments.DTOs;

/// <summary>
/// Flattened, list/detail-friendly projection of an appointment. Includes doctor/patient
/// names inline so the frontend never needs a second round trip to render a row.
/// </summary>
public record AppointmentDto(
    Guid Id,
    Guid DoctorId,
    string DoctorName,
    string DoctorSpecialty,
    Guid PatientId,
    string PatientName,
    DateTimeOffset ScheduledStartUtc,
    DateTimeOffset ScheduledEndUtc,
    AppointmentStatus Status,
    string Reason,
    string? Notes,
    DateTimeOffset CreatedAtUtc);
