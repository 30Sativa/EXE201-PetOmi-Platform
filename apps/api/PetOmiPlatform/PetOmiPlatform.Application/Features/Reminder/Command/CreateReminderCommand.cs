using MediatR;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Request;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Reminder.Command
{
    public record CreateReminderCommand(
        Guid UserId,
        CreateReminderRequest Request) : IRequest<ReminderResponse>;
}
