using FluentAssertions;
using FluentValidation.TestHelper;
using HospitalSystem.Application.Appointments.Commands;
using Xunit;

namespace HospitalSystem.Tests.Appointments;

public class CreateAppointmentCommandValidatorTests
{
    private readonly CreateAppointmentCommandValidator _validator = new();

    [Fact]
    public void Fails_WhenStartIsInThePast()
    {
        var command = new CreateAppointmentCommand(
            Guid.NewGuid(), Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow.AddDays(-1).AddMinutes(30),
            "Checkup");

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.ScheduledStartUtc);
    }

    [Fact]
    public void Fails_WhenEndIsBeforeStart()
    {
        var start = DateTimeOffset.UtcNow.AddDays(1);
        var command = new CreateAppointmentCommand(Guid.NewGuid(), Guid.NewGuid(), start, start.AddMinutes(-10), "Checkup");

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.ScheduledEndUtc);
    }

    [Fact]
    public void Fails_WhenDurationExceedsFourHours()
    {
        var start = DateTimeOffset.UtcNow.AddDays(1);
        var command = new CreateAppointmentCommand(Guid.NewGuid(), Guid.NewGuid(), start, start.AddHours(5), "Checkup");

        var result = _validator.TestValidate(command);
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("4 hours"));
    }

    [Fact]
    public void Succeeds_ForAValidFutureAppointment()
    {
        var start = DateTimeOffset.UtcNow.AddDays(1);
        var command = new CreateAppointmentCommand(Guid.NewGuid(), Guid.NewGuid(), start, start.AddMinutes(30), "Checkup");

        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
