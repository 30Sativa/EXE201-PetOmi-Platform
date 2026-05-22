using MediatR;
using PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Response;
using PetOmiPlatform.Application.Features.ReminderPreference.Query;

namespace PetOmiPlatform.Application.Features.ReminderPreference.Handler
{
    public class GetUserPreferencesQueryHandler : IRequestHandler<GetUserPreferencesQuery, List<ReminderPreferenceResponse>>
    {
        private readonly Domain.Interfaces.Repositories.IReminderPreferenceRepository _preferenceRepo;

        public GetUserPreferencesQueryHandler(
            Domain.Interfaces.Repositories.IReminderPreferenceRepository preferenceRepo)
        {
            _preferenceRepo = preferenceRepo;
        }

        public async Task<List<ReminderPreferenceResponse>> Handle(
            GetUserPreferencesQuery query, CancellationToken ct)
        {
            var prefs = await _preferenceRepo.GetByUserIdAsync(query.UserId);
            return prefs.Select(p => new ReminderPreferenceResponse
            {
                PreferenceId = p.Id,
                UserId = p.UserId,
                ReminderType = p.ReminderType.ToString(),
                IsEnabled = p.IsEnabled,
                RemindBeforeMinutes = p.RemindBeforeMinutes,
                Channel = p.Channel,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();
        }
    }
}
