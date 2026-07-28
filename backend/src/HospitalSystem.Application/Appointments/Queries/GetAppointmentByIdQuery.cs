using HospitalSystem.Application.Appointments.DTOs;
using HospitalSystem.Domain.Entities;
using HospitalSystem.Domain.Exceptions;
using HospitalSystem.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Application.Appointments.Queries;

public record GetAppointmentByIdQuery(Guid Id) : IRequest<AppointmentDto>;

public class GetAppointmentByIdQueryHandler(IUnitOfWork unitOfWork) : IRequestHandler<GetAppointmentByIdQuery, AppointmentDto>
{
    public async Task<AppointmentDto> Handle(GetAppointmentByIdQuery request, CancellationToken ct)
    {
        var a = await unitOfWork.Appointments.Query()
            .Include(x => x.Doctor)
            .Include(x => x.Patient)
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(Appointment), request.Id);

        return new AppointmentDto(
            a.Id, a.DoctorId, a.Doctor!.FullName, a.Doctor.Specialty,
            a.PatientId, a.Patient!.FullName,
            a.ScheduledStartUtc, a.ScheduledEndUtc,
            a.Status, a.Reason, a.Notes, a.CreatedAtUtc);
    }
}
