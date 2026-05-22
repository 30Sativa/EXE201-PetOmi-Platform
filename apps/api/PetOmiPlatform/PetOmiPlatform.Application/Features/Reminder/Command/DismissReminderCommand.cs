using MediatR;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Reminder.Command
{
    public record DismissReminderCommand(
        Guid UserId,
        Guid ReminderId) : IRequest<ReminderResponse>;
}
