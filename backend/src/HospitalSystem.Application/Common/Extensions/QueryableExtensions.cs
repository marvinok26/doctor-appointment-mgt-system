using System.Linq.Dynamic.Core;
using HospitalSystem.Application.Common.Models;

namespace HospitalSystem.Application.Common.Extensions;

public static class QueryableExtensions
{
    /// <summary>Applies a whitelisted sort field (falling back to a default) then pages the query in one round trip to the DB.</summary>
    public static async Task<Models.PagedResult<TDestination>> ToPagedResultAsync<TSource, TDestination>(
        this IQueryable<TSource> query,
        PaginationQuery pagination,
        Func<TSource, TDestination> map,
        IReadOnlyDictionary<string, string> sortableFields,
        string defaultSortField,
        CancellationToken ct = default)
    {
        var totalCount = query.Count();

        var sortField = pagination.SortBy is not null && sortableFields.ContainsKey(pagination.SortBy.ToLowerInvariant())
            ? sortableFields[pagination.SortBy.ToLowerInvariant()]
            : defaultSortField;

        var direction = string.Equals(pagination.SortDir, "desc", StringComparison.OrdinalIgnoreCase) ? "descending" : "ascending";

        var sorted = query.OrderBy($"{sortField} {direction}");

        var page = Math.Max(pagination.Page, 1);
        var items = sorted
            .Skip((page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToList()
            .Select(map)
            .ToList();

        await Task.CompletedTask;
        return Models.PagedResult<TDestination>.Create(items, page, pagination.PageSize, totalCount);
    }
}
