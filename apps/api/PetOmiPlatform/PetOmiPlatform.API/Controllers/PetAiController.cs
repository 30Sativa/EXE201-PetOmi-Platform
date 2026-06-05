using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common.Authorization;
using PetOmiPlatform.Application.Features.PetAi.DTOs.Response;
using PetOmiPlatform.Application.Features.PetAi.Interfaces;

namespace PetOmiPlatform.API.Controllers;

/// <summary>
/// Internal API cung cấp dữ liệu pet/chat cho AI service.
/// </summary>
[ApiController]
[Route("internal/ai")]
[Authorize(Policy = Policies.InternalApiKey)]
public class PetAiController : ControllerBase
{
    private readonly IPetAiRepository _petAiRepository;
    private readonly ILogger<PetAiController> _logger;

    public PetAiController(IPetAiRepository petAiRepository, ILogger<PetAiController> logger)
    {
        _petAiRepository = petAiRepository;
        _logger = logger;
    }

    /// <summary>Lấy ngữ cảnh cơ bản của pet cho AI service.</summary>
    [HttpGet("pets/{id:guid}/basic-context")]
    [ProducesResponseType(typeof(PetBasicContextResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(PetAiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetBasicContext(Guid id)
    {
        _logger.LogDebug("GetBasicContext for pet {PetId}", id);

        var result = await _petAiRepository.GetBasicContextAsync(id);

        if (result == null)
        {
            return NotFound(new PetAiErrorResponse
            {
                Error = $"Pet with ID {id} not found or inactive."
            });
        }

        return Ok(result);
    }

    /// <summary>Lấy tóm tắt y tế của pet cho AI service.</summary>
    [HttpGet("pets/{id:guid}/medical-summary")]
    [ProducesResponseType(typeof(PetMedicalSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(PetAiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMedicalSummary(Guid id)
    {
        _logger.LogDebug("GetMedicalSummary for pet {PetId}", id);

        var result = await _petAiRepository.GetMedicalSummaryAsync(id);

        if (result == null)
        {
            return NotFound(new PetAiErrorResponse
            {
                Error = $"Pet with ID {id} not found or inactive."
            });
        }

        return Ok(result);
    }

    /// <summary>Lấy các tin nhắn gần nhất của conversation cho AI service.</summary>
    [HttpGet("conversations/{id:guid}/recent-messages")]
    [ProducesResponseType(typeof(RecentMessagesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(PetAiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRecentMessages(Guid id, [FromQuery] int take = 20)
    {
        if (take < 1 || take > 100)
            take = 20;

        _logger.LogDebug("GetRecentMessages for conversation {ConversationId}, take={Take}", id, take);

        var result = await _petAiRepository.GetRecentMessagesAsync(id, take);

        if (result == null)
        {
            return NotFound(new PetAiErrorResponse
            {
                Error = $"Conversation with ID {id} not found or inactive."
            });
        }

        return Ok(result);
    }
}
