using Microsoft.AspNetCore.SignalR;
using PetOmiPlatform.API.Hubs;
using PetOmiPlatform.Application.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.API.Services
{
    public class SignalRNotificationBroadcaster : INotificationBroadcaster
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public SignalRNotificationBroadcaster(IHubContext<NotificationHub> hubContext)
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
}
