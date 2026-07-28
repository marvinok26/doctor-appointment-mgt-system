using FluentAssertions;
using HospitalSystem.Domain.Interfaces;
using HospitalSystem.Infrastructure.Services;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace HospitalSystem.Tests.Auth;

public class TokenServiceTests
{
    private readonly TokenService _sut;

    public TokenServiceTests()
    {
        var settings = Options.Create(new JwtSettings
        {
            Issuer = "HospitalSystem.Tests",
            Audience = "HospitalSystem.Tests.Client",
            Secret = "unit-test-signing-secret-must-be-at-least-32-bytes-long",
            AccessTokenMinutes = 15,
            RefreshTokenAbsoluteDays = 7,
            RefreshTokenIdleMinutes = 30
        });

        _sut = new TokenService(settings, Mock.Of<IRefreshTokenRepository>());
    }

    [Fact]
    public void GenerateAccessToken_ProducesATokenThatExpiresInTheFuture()
    {
        var result = _sut.GenerateAccessToken(Guid.NewGuid(), "user@example.com", ["Patient"]);

        result.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.ExpiresAtUtc.Should().BeAfter(DateTimeOffset.UtcNow);
        result.ExpiresAtUtc.Should().BeBefore(DateTimeOffset.UtcNow.AddMinutes(16));
    }

    [Fact]
    public void MfaChallengeToken_RoundTripsToTheSameUserId()
    {
        var userId = Guid.NewGuid();
        var token = _sut.GenerateMfaChallengeToken(userId);

        var resolved = _sut.ValidateMfaChallengeToken(token);

        resolved.Should().Be(userId);
    }

    [Fact]
    public void ValidateMfaChallengeToken_RejectsGarbageInput()
    {
        _sut.ValidateMfaChallengeToken("not-a-real-token").Should().BeNull();
    }
}
