using Microsoft.AspNetCore.Identity;

namespace HospitalSystem.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;

    /// <summary>Base32-encoded TOTP secret; only ever set server-side, never returned after initial setup.</summary>
    public string? MfaSecret { get; set; }
    public bool MfaEnabled { get; set; }
}

public class ApplicationRole : IdentityRole<Guid>
{
    public ApplicationRole() { }
    public ApplicationRole(string roleName) : base(roleName) { }
}
