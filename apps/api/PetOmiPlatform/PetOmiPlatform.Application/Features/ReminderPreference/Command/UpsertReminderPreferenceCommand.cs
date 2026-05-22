using MediatR;
using PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Request;
using PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.ReminderPreference.Command
{
    public record UpsertReminderPreferenceCommand(
        Guid UserId,
        UpdateReminderPreferenceRequest Request) : IRequest<ReminderPreferenceResponse>;
}
