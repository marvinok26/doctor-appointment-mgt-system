using HospitalSystem.Domain.Common;

namespace HospitalSystem.Domain.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    /// <summary>Returns an IQueryable so Application-layer handlers compose filtering/sorting/paging without over-fetching.</summary>
    IQueryable<T> Query(bool includeDeleted = false);
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void SoftDelete(T entity);
}
