using HospitalSystem.Domain.Common;

namespace HospitalSystem.Domain.Entities;

public class Patient : BaseEntity
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? EmergencyContact { get; set; }
    public string? MedicalNotes { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = [];
}
