namespace HospitalSystem.Application.Patients.DTOs;

public record PatientDto(Guid Id, string FullName, DateOnly DateOfBirth, string PhoneNumber);
