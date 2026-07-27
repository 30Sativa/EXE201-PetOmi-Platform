using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace PetOmiPlatform.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public async Task JoinUserGroup(string userId)
        {
            var currentUserId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.Equals(currentUserId, userId, StringComparison.OrdinalIgnoreCase))
            {
                throw new HubException("Cannot join another user's notification group.");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
        }

        public async Task LeaveUserGroup(string userId)
        {
            var currentUserId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.Equals(currentUserId, userId, StringComparison.OrdinalIgnoreCase))
            {
                throw new HubException("Cannot leave another user's notification group.");
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{userId}");
        }
    }
}
