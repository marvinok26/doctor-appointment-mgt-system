using HospitalSystem.Domain.Entities;

namespace HospitalSystem.Domain.Interfaces;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken token, CancellationToken ct = default);
    Task<RefreshToken?> GetByTokenHashAsync(string tokenHash, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task RevokeAllActiveForUserAsync(Guid userId, string revokedByIp, CancellationToken ct = default);
}
