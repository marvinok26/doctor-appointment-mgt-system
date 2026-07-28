using HospitalSystem.Domain.Common;

namespace HospitalSystem.Domain.Entities;

public class Doctor : BaseEntity
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<DoctorAvailability> Availabilities { get; set; } = [];
}
