using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Entities;
using HospitalSystem.Domain.Exceptions;
using HospitalSystem.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Application.Notifications.Commands;

public record MarkNotificationReadCommand(Guid NotificationId) : IRequest;

public class MarkNotificationReadCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser) : IRequestHandler<MarkNotificationReadCommand>
{
    public async Task Handle(MarkNotificationReadCommand request, CancellationToken ct)
    {
        var notification = await unitOfWork.Notifications.Query()
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId && n.RecipientUserId == currentUser.UserId, ct)
            ?? throw new NotFoundException(nameof(Notification), request.NotificationId);

        notification.IsRead = true;
        unitOfWork.Notifications.Update(notification);
        await unitOfWork.SaveChangesAsync(ct);
    }
}

public record MarkAllNotificationsReadCommand : IRequest;

public class MarkAllNotificationsReadCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser) : IRequestHandler<MarkAllNotificationsReadCommand>
{
    public async Task Handle(MarkAllNotificationsReadCommand request, CancellationToken ct)
    {
        var unread = await unitOfWork.Notifications.Query()
            .Where(n => n.RecipientUserId == currentUser.UserId && !n.IsRead)
            .ToListAsync(ct);

        foreach (var notification in unread)
        {
            notification.IsRead = true;
            unitOfWork.Notifications.Update(notification);
        }

        if (unread.Count > 0) await unitOfWork.SaveChangesAsync(ct);
    }
}
