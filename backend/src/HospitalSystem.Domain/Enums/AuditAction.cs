namespace HospitalSystem.Domain.Enums;

public enum AuditAction
{
    Create = 0,
    Update = 1,
    Delete = 2,
    Login = 3,
    LoginFailed = 4,
    Logout = 5,
    TokenRefresh = 6,
    MfaEnabled = 7,
    MfaChallenge = 8
}
