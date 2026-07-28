namespace HospitalSystem.Infrastructure.Services;

public class EmailSettings
{
    public const string SectionName = "Email";

    public string SmtpHost { get; set; } = "localhost";
    public int SmtpPort { get; set; } = 1025;
    public string FromAddress { get; set; } = "no-reply@hospitalsystem.local";
    public string FromName { get; set; } = "Hospital Appointment System";
    public bool UseSsl { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
}
