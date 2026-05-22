using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface INotificationBroadcaster
    {
        Task SendToUserAsync(string userId, string method, object payload, CancellationToken ct = default);
    }
}
