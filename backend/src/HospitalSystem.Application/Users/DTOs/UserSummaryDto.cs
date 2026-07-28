namespace HospitalSystem.Application.Users.DTOs;

public record UserSummaryDto(Guid Id, string Email, string FullName, IReadOnlyList<string> Roles, bool MfaEnabled, bool LockedOut);
