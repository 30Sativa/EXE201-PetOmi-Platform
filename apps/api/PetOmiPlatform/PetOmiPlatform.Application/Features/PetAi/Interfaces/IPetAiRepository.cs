using PetOmiPlatform.Application.Features.PetAi.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.PetAi.Interfaces;

public interface IPetAiRepository
{
    Task<PetBasicContextResponse?> GetBasicContextAsync(Guid petId);
    Task<PetMedicalSummaryResponse?> GetMedicalSummaryAsync(Guid petId);
    Task<RecentMessagesResponse?> GetRecentMessagesAsync(Guid conversationId, int take = 20);
}
