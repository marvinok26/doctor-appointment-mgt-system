using HospitalSystem.Domain.Common;
using HospitalSystem.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Infrastructure.Persistence.Repositories;

public class Repository<T>(ApplicationDbContext context) : IRepository<T> where T : BaseEntity
{
    private readonly DbSet<T> _set = context.Set<T>();

    public IQueryable<T> Query(bool includeDeleted = false) =>
        includeDeleted ? _set.IgnoreQueryFilters().AsQueryable() : _set.AsQueryable();

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _set.FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task AddAsync(T entity, CancellationToken ct = default) => await _set.AddAsync(entity, ct);

    public void Update(T entity) => _set.Update(entity);

    public void SoftDelete(T entity)
    {
        entity.IsDeleted = true;
        entity.ModifiedAtUtc = DateTimeOffset.UtcNow;
        _set.Update(entity);
    }
}
