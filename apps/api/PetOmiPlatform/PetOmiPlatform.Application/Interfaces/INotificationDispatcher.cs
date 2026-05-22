using PetOmiPlatform.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface INotificationDispatcher
    {
        Task DispatchReminderAsync(ReminderDomain reminder, CancellationToken ct = default);
    }
}
