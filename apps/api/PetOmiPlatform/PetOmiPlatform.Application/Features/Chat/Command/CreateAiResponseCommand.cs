using MediatR;
using PetOmiPlatform.Application.Features.Chat.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Chat.Command;

public record CreateAiResponseCommand(
    Guid SourceMessageId,
    Guid ConversationId,
    string? Response,
    string? Status,
    string? ErrorMessage,
    string? Intent,
    string? UrgencyLevel,
    bool RagUsed,
    int ChunksUsed,
    string? VetRecommendation,
    string? Model,
    int TokensInput,
    int TokensOutput,
    List<SourceEntryDto>? Sources
) : IRequest<ChatMessageResponse>;
