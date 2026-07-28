using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OtpNet;

namespace HospitalSystem.Infrastructure.Services;

public class IdentityService(UserManager<ApplicationUser> userManager) : IIdentityService
{
    public async Task<CreateUserResult> CreateUserAsync(string email, string fullName, string password, string role, CancellationToken ct = default)
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            EmailConfirmed = true // no external mail verification provider wired up in this demo environment
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            return new CreateUserResult(false, null, result.Errors.Select(e => e.Description).ToList());

        await userManager.AddToRoleAsync(user, role);
        return new CreateUserResult(true, user.Id, []);
    }

    public async Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        return user is null ? null : await ToUserAccountAsync(user);
    }

    public async Task<UserAccount?> FindByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        return user is null ? null : await ToUserAccountAsync(user);
    }

    public async Task<bool> CheckPasswordAsync(Guid userId, string password, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null) return false;

        var valid = await userManager.CheckPasswordAsync(user, password);
        if (!valid)
            await userManager.AccessFailedAsync(user);
        else
            await userManager.ResetAccessFailedCountAsync(user);

        return valid;
    }

    public async Task<bool> IsLockedOutAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        return user is not null && await userManager.IsLockedOutAsync(user);
    }

    public async Task<string> GenerateMfaSetupSecretAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");

        var secret = Base32Encoding.ToString(KeyGeneration.GenerateRandomKey(20));
        user.MfaSecret = secret;
        user.MfaEnabled = false;
        await userManager.UpdateAsync(user);

        return secret;
    }

    public async Task<bool> VerifyAndEnableMfaAsync(Guid userId, string code, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user?.MfaSecret is null) return false;

        if (!VerifyTotp(user.MfaSecret, code)) return false;

        user.MfaEnabled = true;
        await userManager.UpdateAsync(user);
        return true;
    }

    public async Task<bool> VerifyMfaCodeAsync(Guid userId, string code, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        return user?.MfaSecret is not null && user.MfaEnabled && VerifyTotp(user.MfaSecret, code);
    }

    public async Task<(IReadOnlyList<UserAccount> Users, int TotalCount)> ListUsersAsync(
        int page, int pageSize, string? search, string? role, CancellationToken ct = default)
    {
        if (!string.IsNullOrWhiteSpace(role))
        {
            // GetUsersInRoleAsync doesn't support server-side paging, but role rosters at
            // hospital-staff scale (dozens, not millions) make in-memory paging fine here.
            var inRole = await userManager.GetUsersInRoleAsync(role);
            var filtered = string.IsNullOrWhiteSpace(search)
                ? inRole
                : inRole.Where(u => u.Email!.Contains(search, StringComparison.OrdinalIgnoreCase)
                    || u.FullName.Contains(search, StringComparison.OrdinalIgnoreCase)).ToList();

            var pagedInRole = filtered.OrderBy(u => u.FullName).Skip((page - 1) * pageSize).Take(pageSize).ToList();
            // Sequential, not Task.WhenAll: these share one scoped UserManager/DbContext, which
            // EF Core does not allow concurrent operations against (see ListUsersAsync's other branch).
            var accountsInRole = new List<UserAccount>(pagedInRole.Count);
            foreach (var user in pagedInRole)
                accountsInRole.Add(await ToUserAccountAsync(user));
            return (accountsInRole, filtered.Count);
        }

        var query = userManager.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u => u.Email!.Contains(search) || u.FullName.Contains(search));

        var totalCount = await query.CountAsync(ct);
        var pageOfUsers = await query.OrderBy(u => u.FullName).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        // Sequential, not Task.WhenAll — see the role-filtered branch above for why.
        var accounts = new List<UserAccount>(pageOfUsers.Count);
        foreach (var user in pageOfUsers)
            accounts.Add(await ToUserAccountAsync(user));

        return (accounts, totalCount);
    }

    public async Task SetLockoutAsync(Guid userId, bool locked, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null) return;

        await userManager.SetLockoutEnabledAsync(user, true);
        await userManager.SetLockoutEndDateAsync(user, locked ? DateTimeOffset.MaxValue : null);
    }

    public async Task<int> CountUsersInRoleAsync(string role, CancellationToken ct = default) =>
        (await userManager.GetUsersInRoleAsync(role)).Count;

    public Task<int> CountAllUsersAsync(CancellationToken ct = default) => userManager.Users.CountAsync(ct);

    private static bool VerifyTotp(string base32Secret, string code)
    {
        var totp = new Totp(Base32Encoding.ToBytes(base32Secret));
        return totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);
    }

    private async Task<UserAccount> ToUserAccountAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var lockedOut = await userManager.IsLockedOutAsync(user);
        return new UserAccount(user.Id, user.Email!, user.FullName, user.MfaEnabled, roles.ToList(), lockedOut);
    }
}
