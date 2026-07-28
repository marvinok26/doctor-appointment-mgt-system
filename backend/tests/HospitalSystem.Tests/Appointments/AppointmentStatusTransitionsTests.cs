using FluentAssertions;
using HospitalSystem.Application.Appointments.Commands;
using HospitalSystem.Domain.Enums;
using Xunit;

namespace HospitalSystem.Tests.Appointments;

public class AppointmentStatusTransitionsTests
{
    [Theory]
    [InlineData(AppointmentStatus.Requested, AppointmentStatus.Confirmed, true)]
    [InlineData(AppointmentStatus.Requested, AppointmentStatus.Cancelled, true)]
    [InlineData(AppointmentStatus.Requested, AppointmentStatus.Completed, false)]
    [InlineData(AppointmentStatus.Confirmed, AppointmentStatus.CheckedIn, true)]
    [InlineData(AppointmentStatus.Confirmed, AppointmentStatus.NoShow, true)]
    [InlineData(AppointmentStatus.CheckedIn, AppointmentStatus.Completed, true)]
    [InlineData(AppointmentStatus.CheckedIn, AppointmentStatus.Cancelled, false)]
    [InlineData(AppointmentStatus.Completed, AppointmentStatus.Confirmed, false)]
    [InlineData(AppointmentStatus.Cancelled, AppointmentStatus.Confirmed, false)]
    [InlineData(AppointmentStatus.NoShow, AppointmentStatus.Completed, false)]
    public void CanTransition_EnforcesAllowedWorkflow(AppointmentStatus from, AppointmentStatus to, bool expected)
    {
        AppointmentStatusTransitions.CanTransition(from, to).Should().Be(expected);
    }
}
