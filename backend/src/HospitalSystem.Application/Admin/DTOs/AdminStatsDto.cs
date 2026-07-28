namespace HospitalSystem.Application.Admin.DTOs;

public record AdminStatsDto(
    int TotalUsers,
    int TotalDoctors,
    int TotalPatients,
    IReadOnlyDictionary<string, int> UsersByRole,
    IReadOnlyDictionary<string, int> AppointmentsByStatus,
    int AppointmentsToday);
