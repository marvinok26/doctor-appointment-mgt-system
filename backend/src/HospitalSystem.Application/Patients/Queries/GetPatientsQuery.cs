using HospitalSystem.Application.Common.Extensions;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Application.Patients.DTOs;
using HospitalSystem.Domain.Interfaces;
using MediatR;

namespace HospitalSystem.Application.Patients.Queries;

/// <summary>Receptionist/Admin-only directory search, used when booking a walk-in appointment.</summary>
public record GetPatientsQuery(PaginationQuery Pagination, string? Search) : IRequest<PagedResult<PatientDto>>;

public class GetPatientsQueryHandler(IUnitOfWork unitOfWork) : IRequestHandler<GetPatientsQuery, PagedResult<PatientDto>>
{
    private static readonly IReadOnlyDictionary<string, string> SortableFields = new Dictionary<string, string>
    {
        ["name"] = nameof(Domain.Entities.Patient.FullName)
    };

    public async Task<PagedResult<PatientDto>> Handle(GetPatientsQuery request, CancellationToken ct)
    {
        var query = unitOfWork.Patients.Query();
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(p => p.FullName.Contains(request.Search) || p.PhoneNumber.Contains(request.Search));

        return await query.ToPagedResultAsync(
            request.Pagination,
            p => new PatientDto(p.Id, p.FullName, p.DateOfBirth, p.PhoneNumber),
            SortableFields,
            defaultSortField: nameof(Domain.Entities.Patient.FullName),
            ct);
    }
}
