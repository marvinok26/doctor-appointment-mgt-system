namespace HospitalSystem.Application.Doctors.DTOs;

public record DoctorDto(Guid Id, string FullName, string Specialty, string? Bio, bool IsActive);

public record AvailabilitySlotDto(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);
