using HospitalSystem.Application.Appointments.DTOs;
using HospitalSystem.Application.Common.Extensions;
using HospitalSystem.Application.Common.Models;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Application.Appointments.Queries;

/// <summary>
/// One query handles every role's list view: a patient's own history, a doctor's schedule,
/// or the receptionist/admin front-desk view — access scoping is applied via the optional
/// DoctorId/PatientId filters, which the controller pins based on the caller's role.
/// </summary>
public record GetAppointmentsQuery(
    PaginationQuery Pagination,
    Guid? DoctorId,
    Guid? PatientId,
    AppointmentStatus? Status,
    DateTimeOffset? FromUtc,
    DateTimeOffset? ToUtc) : IRequest<PagedResult<AppointmentDto>>;

public class GetAppointmentsQueryHandler(IUnitOfWork unitOfWork) : IRequestHandler<GetAppointmentsQuery, PagedResult<AppointmentDto>>
{
    private static readonly IReadOnlyDictionary<string, string> SortableFields = new Dictionary<string, string>
    {
        ["scheduledstart"] = nameof(Domain.Entities.Appointment.ScheduledStartUtc),
        ["status"] = nameof(Domain.Entities.Appointment.Status),
        ["createdat"] = nameof(Domain.Entities.Appointment.CreatedAtUtc)
    };

    public async Task<PagedResult<AppointmentDto>> Handle(GetAppointmentsQuery request, CancellationToken ct)
    {
        var query = unitOfWork.Appointments.Query()
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .AsQueryable();

        if (request.DoctorId is not null) query = query.Where(a => a.DoctorId == request.DoctorId);
        if (request.PatientId is not null) query = query.Where(a => a.PatientId == request.PatientId);
        if (request.Status is not null) query = query.Where(a => a.Status == request.Status);
        if (request.FromUtc is not null) query = query.Where(a => a.ScheduledStartUtc >= request.FromUtc);
        if (request.ToUtc is not null) query = query.Where(a => a.ScheduledStartUtc <= request.ToUtc);

        return await query.ToPagedResultAsync(
            request.Pagination,
            a => new AppointmentDto(
                a.Id, a.DoctorId, a.Doctor!.FullName, a.Doctor.Specialty,
                a.PatientId, a.Patient!.FullName,
                a.ScheduledStartUtc, a.ScheduledEndUtc,
                a.Status, a.Reason, a.Notes, a.CreatedAtUtc),
            SortableFields,
            defaultSortField: nameof(Domain.Entities.Appointment.ScheduledStartUtc),
            ct);
    }
}
