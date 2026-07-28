namespace HospitalSystem.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    IReadOnlyList<string> Roles { get; }
    string IpAddress { get; }
    string? UserAgent { get; }
    bool IsInRole(string role);
}
