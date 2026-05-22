using MediatR;
using PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Request;
using PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Response;
using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.ReminderPreference.Query
{
    public record GetUserPreferencesQuery(Guid UserId) : IRequest<List<ReminderPreferenceResponse>>;
}
