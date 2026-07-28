namespace HospitalSystem.Domain.Enums;

/// <summary>Well-known role names used across RBAC checks. Mirrors seeded ASP.NET Core Identity roles.</summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Doctor = "Doctor";
    public const string Receptionist = "Receptionist";
    public const string Patient = "Patient";

    public static readonly IReadOnlyList<string> All = [Admin, Doctor, Receptionist, Patient];
}
