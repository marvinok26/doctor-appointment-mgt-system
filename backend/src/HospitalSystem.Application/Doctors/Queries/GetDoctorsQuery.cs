using HospitalSystem.Application.Common.Extensions;
using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Application.Doctors.DTOs;
using HospitalSystem.Domain.Interfaces;
using MediatR;

namespace HospitalSystem.Application.Doctors.Queries;

/// <summary>Doctor rosters change rarely relative to how often they're read, so the first page of
/// the default (unfiltered) view is cached in Redis for a short TTL and busted on any doctor write.</summary>
public record GetDoctorsQuery(PaginationQuery Pagination, string? Specialty, bool ActiveOnly) : IRequest<PagedResult<DoctorDto>>;

public class GetDoctorsQueryHandler(IUnitOfWork unitOfWork, ICacheService cache) : IRequestHandler<GetDoctorsQuery, PagedResult<DoctorDto>>
{
    private static readonly IReadOnlyDictionary<string, string> SortableFields = new Dictionary<string, string>
    {
        ["name"] = nameof(Domain.Entities.Doctor.FullName),
        ["specialty"] = nameof(Domain.Entities.Doctor.Specialty)
    };

    public async Task<PagedResult<DoctorDto>> Handle(GetDoctorsQuery request, CancellationToken ct)
    {
        var cacheKey = $"doctors:list:p{request.Pagination.Page}:s{request.Pagination.PageSize}:{request.Specialty}:{request.ActiveOnly}:{request.Pagination.SortBy}:{request.Pagination.SortDir}";
        var cached = await cache.GetAsync<PagedResult<DoctorDto>>(cacheKey, ct);
        if (cached is not null) return cached;

        var query = unitOfWork.Doctors.Query();
        if (request.ActiveOnly) query = query.Where(d => d.IsActive);
        if (!string.IsNullOrWhiteSpace(request.Specialty)) query = query.Where(d => d.Specialty == request.Specialty);

        var result = await query.ToPagedResultAsync(
            request.Pagination,
            d => new DoctorDto(d.Id, d.FullName, d.Specialty, d.Bio, d.IsActive),
            SortableFields,
            defaultSortField: nameof(Domain.Entities.Doctor.FullName),
            ct);

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), ct);
        return result;
    }
}
