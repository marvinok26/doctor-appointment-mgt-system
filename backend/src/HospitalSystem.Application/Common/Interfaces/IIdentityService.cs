namespace HospitalSystem.Application.Common.Interfaces;

public record CreateUserResult(bool Succeeded, Guid? UserId, IReadOnlyList<string> Errors);

public record UserAccount(Guid Id, string Email, string FullName, bool MfaEnabled, IReadOnlyList<string> Roles, bool LockedOut);

public interface IIdentityService
{
    Task<CreateUserResult> CreateUserAsync(string email, string fullName, string password, string role, CancellationToken ct = default);
    Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<UserAccount?> FindByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Validates credentials and records failed attempts, tripping ASP.NET Core Identity lockout after repeated failures.</summary>
    Task<bool> CheckPasswordAsync(Guid userId, string password, CancellationToken ct = default);
    Task<bool> IsLockedOutAsync(Guid userId, CancellationToken ct = default);

    Task<string> GenerateMfaSetupSecretAsync(Guid userId, CancellationToken ct = default);
    Task<bool> VerifyAndEnableMfaAsync(Guid userId, string code, CancellationToken ct = default);
    Task<bool> VerifyMfaCodeAsync(Guid userId, string code, CancellationToken ct = default);

    /// <summary>Admin user directory. When <paramref name="role"/> is set, paging happens in memory
    /// over that role's member list (acceptable at hospital-staff scale); otherwise it's a proper
    /// server-side paged query over all accounts.</summary>
    Task<(IReadOnlyList<UserAccount> Users, int TotalCount)> ListUsersAsync(
        int page, int pageSize, string? search, string? role, CancellationToken ct = default);

    /// <summary>Locks (or unlocks) an account indefinitely — the admin "disable this user" action.</summary>
    Task SetLockoutAsync(Guid userId, bool locked, CancellationToken ct = default);

    Task<int> CountUsersInRoleAsync(string role, CancellationToken ct = default);
    Task<int> CountAllUsersAsync(CancellationToken ct = default);
}
