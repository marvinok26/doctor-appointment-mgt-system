namespace HospitalSystem.Application.Notifications.DTOs;

public record NotificationDto(Guid Id, string Title, string Message, Guid? RelatedAppointmentId, bool IsRead, DateTimeOffset CreatedAtUtc);
