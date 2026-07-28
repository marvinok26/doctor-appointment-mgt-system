namespace HospitalSystem.Application.Common.Models;

/// <summary>Shared query-string contract: ?page=1&amp;pageSize=20&amp;sortBy=field&amp;sortDir=asc</summary>
public class PaginationQuery
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    public int Page { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value <= 0 ? 20 : Math.Min(value, MaxPageSize);
    }

    public string? SortBy { get; set; }
    public string SortDir { get; set; } = "asc";
}
