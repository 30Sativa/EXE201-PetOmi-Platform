using Microsoft.AspNetCore.SignalR;
using PetOmiPlatform.API.Hubs;
using PetOmiPlatform.Application.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.API.Services;

public class SignalRChatResponseBroadcaster : IChatResponseBroadcaster
{
    private readonly IHubContext<ChatHub> _hubContext;

    public SignalRChatResponseBroadcaster(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendToUserAsync(string userId, string method, object payload, CancellationToken ct = default)
    {
        await _hubContext.Clients
            .Group($"user:{userId}")
            .SendAsync(method, payload, ct);
    }
}
