using HospitalSystem.Domain.Entities;
using HospitalSystem.Domain.Interfaces;

namespace HospitalSystem.Infrastructure.Persistence.Repositories;

public class UnitOfWork(ApplicationDbContext context) : IUnitOfWork
{
    public IRepository<Doctor> Doctors { get; } = new Repository<Doctor>(context);
    public IRepository<Patient> Patients { get; } = new Repository<Patient>(context);
    public IRepository<Appointment> Appointments { get; } = new Repository<Appointment>(context);
    public IRepository<DoctorAvailability> DoctorAvailabilities { get; } = new Repository<DoctorAvailability>(context);
    public IRepository<Notification> Notifications { get; } = new Repository<Notification>(context);
    public IRepository<AuditLog> AuditLogs { get; } = new Repository<AuditLog>(context);

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
