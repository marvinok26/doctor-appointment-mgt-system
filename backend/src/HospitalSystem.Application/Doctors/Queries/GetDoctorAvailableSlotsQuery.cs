using HospitalSystem.Application.Common.Interfaces;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Application.Doctors.Queries;

public record FreeSlotDto(DateTimeOffset StartUtc, DateTimeOffset EndUtc);

/// <summary>Computes free 30-minute slots for a doctor on a given date from their recurring
/// weekly availability minus already-booked appointments. Cached per doctor/date and busted
/// whenever an appointment is created against that doctor.</summary>
public record GetDoctorAvailableSlotsQuery(Guid DoctorId, DateOnly Date) : IRequest<IReadOnlyList<FreeSlotDto>>;

public class GetDoctorAvailableSlotsQueryHandler(IUnitOfWork unitOfWork, ICacheService cache)
    : IRequestHandler<GetDoctorAvailableSlotsQuery, IReadOnlyList<FreeSlotDto>>
{
    private static readonly TimeSpan SlotLength = TimeSpan.FromMinutes(30);

    public async Task<IReadOnlyList<FreeSlotDto>> Handle(GetDoctorAvailableSlotsQuery request, CancellationToken ct)
    {
        var cacheKey = $"doctor-availability:{request.DoctorId}:{request.Date:yyyy-MM-dd}";
        var cached = await cache.GetAsync<List<FreeSlotDto>>(cacheKey, ct);
        if (cached is not null) return cached;

        var dayOfWeek = request.Date.DayOfWeek;
        var availabilities = await unitOfWork.DoctorAvailabilities.Query()
            .Where(a => a.DoctorId == request.DoctorId && a.DayOfWeek == dayOfWeek)
            .ToListAsync(ct);

        var dayStart = new DateTimeOffset(request.Date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var booked = await unitOfWork.Appointments.Query()
            .Where(a => a.DoctorId == request.DoctorId
                && a.Status != AppointmentStatus.Cancelled
                && a.ScheduledStartUtc >= dayStart
                && a.ScheduledStartUtc < dayStart.AddDays(1))
            .Select(a => new { a.ScheduledStartUtc, a.ScheduledEndUtc })
            .ToListAsync(ct);

        var freeSlots = new List<FreeSlotDto>();
        foreach (var window in availabilities)
        {
            var slotStart = dayStart.Add(window.StartTime.ToTimeSpan());
            var windowEnd = dayStart.Add(window.EndTime.ToTimeSpan());

            while (slotStart.Add(SlotLength) <= windowEnd)
            {
                var slotEnd = slotStart.Add(SlotLength);
                var overlaps = booked.Any(b => b.ScheduledStartUtc < slotEnd && slotStart < b.ScheduledEndUtc);
                if (!overlaps && slotStart > DateTimeOffset.UtcNow)
                    freeSlots.Add(new FreeSlotDto(slotStart, slotEnd));

                slotStart = slotEnd;
            }
        }

        await cache.SetAsync(cacheKey, freeSlots, TimeSpan.FromMinutes(2), ct);
        return freeSlots;
    }
}
