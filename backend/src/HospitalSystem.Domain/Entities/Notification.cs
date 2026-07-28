using HospitalSystem.Domain.Common;

namespace HospitalSystem.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid RecipientUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? RelatedAppointmentId { get; set; }
    public bool IsRead { get; set; }
}
