using HospitalSystem.Application.AuditLogs.DTOs;
using HospitalSystem.Application.Common.Extensions;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Interfaces;
using MediatR;

namespace HospitalSystem.Application.AuditLogs.Queries;

/// <summary>Admin-only (enforced at the controller); supports the same filter/sort/page contract
/// as every other list endpoint so the audit viewer isn't a special case in the frontend.</summary>
public record GetAuditLogsQuery(PaginationQuery Pagination, AuditAction? Action, Guid? UserId, DateTimeOffset? FromUtc, DateTimeOffset? ToUtc)
    : IRequest<PagedResult<AuditLogDto>>;

public class GetAuditLogsQueryHandler(IUnitOfWork unitOfWork) : IRequestHandler<GetAuditLogsQuery, PagedResult<AuditLogDto>>
{
    private static readonly IReadOnlyDictionary<string, string> SortableFields = new Dictionary<string, string>
    {
        ["createdat"] = nameof(Domain.Entities.AuditLog.CreatedAtUtc),
        ["action"] = nameof(Domain.Entities.AuditLog.Action)
    };

    public async Task<PagedResult<AuditLogDto>> Handle(GetAuditLogsQuery request, CancellationToken ct)
    {
        var query = unitOfWork.AuditLogs.Query();

        if (request.Action is not null) query = query.Where(a => a.Action == request.Action);
        if (request.UserId is not null) query = query.Where(a => a.UserId == request.UserId);
        if (request.FromUtc is not null) query = query.Where(a => a.CreatedAtUtc >= request.FromUtc);
        if (request.ToUtc is not null) query = query.Where(a => a.CreatedAtUtc <= request.ToUtc);

        return await query.ToPagedResultAsync(
            request.Pagination,
            a => new AuditLogDto(a.Id, a.UserId, a.UserEmail, a.Action, a.EntityName, a.EntityId, a.OldValues, a.NewValues, a.IpAddress, a.CreatedAtUtc),
            SortableFields,
            defaultSortField: nameof(Domain.Entities.AuditLog.CreatedAtUtc),
            ct);
    }
}
