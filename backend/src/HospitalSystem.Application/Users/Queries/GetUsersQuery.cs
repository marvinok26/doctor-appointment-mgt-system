using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Application.Users.DTOs;
using MediatR;

namespace HospitalSystem.Application.Users.Queries;

/// <summary>Admin-only account directory, filterable by role — the "manage users" half of the admin portal.</summary>
public record GetUsersQuery(PaginationQuery Pagination, string? Search, string? Role) : IRequest<PagedResult<UserSummaryDto>>;

public class GetUsersQueryHandler(IIdentityService identityService) : IRequestHandler<GetUsersQuery, PagedResult<UserSummaryDto>>
{
    public async Task<PagedResult<UserSummaryDto>> Handle(GetUsersQuery request, CancellationToken ct)
    {
        var (users, totalCount) = await identityService.ListUsersAsync(
            request.Pagination.Page, request.Pagination.PageSize, request.Search, request.Role, ct);

        var items = users.Select(u => new UserSummaryDto(u.Id, u.Email, u.FullName, u.Roles, u.MfaEnabled, u.LockedOut)).ToList();
        return PagedResult<UserSummaryDto>.Create(items, request.Pagination.Page, request.Pagination.PageSize, totalCount);
    }
}
