using HospitalSystem.Application.Common.Extensions;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Application.Notifications.DTOs;
using HospitalSystem.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Application.Notifications.Queries;

/// <summary>Always scoped to the caller (never takes a userId param) — a user's notifications
/// are inherently private, so the current user is read server-side from the JWT, not the request.</summary>
public record GetNotificationsQuery(PaginationQuery Pagination, bool UnreadOnly) : IRequest<PagedResult<NotificationDto>>;

public class GetNotificationsQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<GetNotificationsQuery, PagedResult<NotificationDto>>
{
    private static readonly IReadOnlyDictionary<string, string> SortableFields = new Dictionary<string, string>
    {
        ["createdat"] = nameof(Domain.Entities.Notification.CreatedAtUtc)
    };

    public async Task<PagedResult<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken ct)
    {
        var query = unitOfWork.Notifications.Query().Where(n => n.RecipientUserId == currentUser.UserId);
        if (request.UnreadOnly) query = query.Where(n => !n.IsRead);

        return await query.ToPagedResultAsync(
            request.Pagination,
            n => new NotificationDto(n.Id, n.Title, n.Message, n.RelatedAppointmentId, n.IsRead, n.CreatedAtUtc),
            SortableFields,
            defaultSortField: nameof(Domain.Entities.Notification.CreatedAtUtc),
            ct);
    }
}

public record GetUnreadNotificationCountQuery : IRequest<int>;

public class GetUnreadNotificationCountQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    : IRequestHandler<GetUnreadNotificationCountQuery, int>
{
    public Task<int> Handle(GetUnreadNotificationCountQuery request, CancellationToken ct) =>
        unitOfWork.Notifications.Query().CountAsync(n => n.RecipientUserId == currentUser.UserId && !n.IsRead, ct);
}
