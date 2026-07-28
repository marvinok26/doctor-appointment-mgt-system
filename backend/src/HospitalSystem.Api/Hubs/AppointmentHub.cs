using System.Security.Claims;
using HospitalSystem.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HospitalSystem.Api.Hubs;

/// <summary>
/// Clients join a group per role/identity on connect so server-side pushes can be scoped:
/// doctors and receptionists get "role-Doctor"/"role-Receptionist" broadcasts, patients get a
/// private "patient-{userId}" group. The JWT bearer token is required (see Program.cs SignalR
/// auth wiring, which reads it from the access_token query string on the websocket handshake).
/// </summary>
[Authorize]
public class AppointmentHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var roles = Context.User?.FindAll(ClaimTypes.Role).Select(c => c.Value) ?? [];

        if (userId is not null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"patient-{userId}");

        foreach (var role in roles)
        {
            if (role is Roles.Doctor or Roles.Receptionist or Roles.Admin)
                await Groups.AddToGroupAsync(Context.ConnectionId, $"role-{role}");
        }

        await base.OnConnectedAsync();
    }
}
