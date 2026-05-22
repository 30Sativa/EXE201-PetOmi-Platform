using MediatR;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Response;
using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.Reminder.Query
{
    public record GetUserRemindersQuery(Guid UserId) : IRequest<List<ReminderResponse>>;
}
