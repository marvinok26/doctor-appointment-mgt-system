using HospitalSystem.Domain.Common;

namespace HospitalSystem.Domain.Entities;

/// <summary>A recurring weekly working slot for a doctor, used to validate appointment scheduling.</summary>
public class DoctorAvailability : BaseEntity
{
    public Guid DoctorId { get; set; }
    public Doctor? Doctor { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
