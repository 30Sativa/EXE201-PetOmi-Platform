using MediatR;
using PetOmiPlatform.Application.Features.Chat.Command;
using PetOmiPlatform.Application.Features.Chat.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Chat.Handler
{
    public class CreateAiResponseCommandHandler : IRequestHandler<CreateAiResponseCommand, ChatMessageResponse>
    {
        private readonly IChatMessageRepository _chatMessageRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateAiResponseCommandHandler(
            IChatMessageRepository chatMessageRepository,
            IUnitOfWork unitOfWork)
        {
            _chatMessageRepository = chatMessageRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ChatMessageResponse> Handle(CreateAiResponseCommand command, CancellationToken ct)
        {
            var sourceMessage = await _chatMessageRepository.GetByIdAsync(command.SourceMessageId)
                ?? throw new InvalidOperationException("Source message not found.");

            if (sourceMessage.ConversationId != command.ConversationId)
                throw new InvalidOperationException("Source message does not belong to the conversation.");

            var commandFailed = string.Equals(command.Status, "failed", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(command.Response);

            if (sourceMessage.Status == MessageStatus.Cancelled)
                return _mapTerminalSourceMessage(sourceMessage, command.ErrorMessage);

            if (sourceMessage.Status == MessageStatus.Completed)
                return _mapTerminalSourceMessage(sourceMessage, null);

            if (sourceMessage.Status == MessageStatus.Failed && commandFailed)
                return _mapTerminalSourceMessage(sourceMessage, command.ErrorMessage);

            if (commandFailed)
            {
                return await _handleFailedResponse(command, sourceMessage, ct);
            }

            return await _handleSuccessfulResponse(command, sourceMessage, ct);
        }

        private async Task<ChatMessageResponse> _handleSuccessfulResponse(
            CreateAiResponseCommand command,
            ChatMessageDomain sourceMessage,
            CancellationToken ct)
        {
            sourceMessage.MarkCompleted();
            await _chatMessageRepository.UpdateAsync(sourceMessage);

            var sourcesJson = command.Sources == null || command.Sources.Count == 0
                ? null
                : JsonSerializer.Serialize(command.Sources);

            var aiMessage = ChatMessageDomain.CreateAiResponse(
                conversationId: command.ConversationId,
                content: command.Response!,
                intent: command.Intent,
                urgencyLevel: command.UrgencyLevel,
                ragUsed: command.RagUsed,
                chunksUsed: command.ChunksUsed,
                model: command.Model,
                tokensInput: command.TokensInput,
                tokensOutput: command.TokensOutput,
                vetRecommendation: command.VetRecommendation,
                sourcesJson: sourcesJson
            );

            await _chatMessageRepository.AddAsync(aiMessage);
            await _unitOfWork.SaveChangesAsync(ct);

            var sources = new List<SourceEntryDto>();
            if (command.Sources != null)
            {
                foreach (var s in command.Sources)
                {
                    sources.Add(new SourceEntryDto
                    {
                        Url = s.Url ?? "",
                        Title = s.Title ?? "",
                        Snippet = s.Snippet ?? ""
                    });
                }
            }

            return new ChatMessageResponse
            {
                MessageId = aiMessage.Id,
                ConversationId = aiMessage.ConversationId,
                SenderRole = aiMessage.SenderRole.ToString(),
                Status = aiMessage.Status.ToString(),
                Content = aiMessage.Content,
                Intent = aiMessage.Intent,
                UrgencyLevel = aiMessage.UrgencyLevel,
                VetRecommendation = aiMessage.VetRecommendation,
                RagUsed = aiMessage.RagUsed,
                ChunksUsed = aiMessage.ChunksUsed,
                Model = aiMessage.Model,
                TokensInput = aiMessage.TokensInput,
                TokensOutput = aiMessage.TokensOutput,
                Sources = sources,
                IsActive = aiMessage.IsActive,
                CreatedAt = aiMessage.CreatedAt
            };
        }

        private async Task<ChatMessageResponse> _handleFailedResponse(
            CreateAiResponseCommand command,
            ChatMessageDomain sourceMessage,
            CancellationToken ct)
        {
            sourceMessage.MarkFailed();
            await _chatMessageRepository.UpdateAsync(sourceMessage);

            var aiMessage = ChatMessageDomain.CreateAiErrorResponse(
                conversationId: command.ConversationId,
                content: string.IsNullOrWhiteSpace(command.ErrorMessage)
                    ? "Yeu cau het thoi gian cho, vui long thu lai."
                    : command.ErrorMessage,
                intent: command.Intent,
                urgencyLevel: command.UrgencyLevel);

            await _chatMessageRepository.AddAsync(aiMessage);
            await _unitOfWork.SaveChangesAsync(ct);

            return new ChatMessageResponse
            {
                MessageId = aiMessage.Id,
                ConversationId = aiMessage.ConversationId,
                SenderRole = aiMessage.SenderRole.ToString(),
                Status = aiMessage.Status.ToString(),
                Content = aiMessage.Content,
                Intent = aiMessage.Intent,
                UrgencyLevel = aiMessage.UrgencyLevel,
                RagUsed = false,
                ChunksUsed = 0,
                Model = null,
                TokensInput = 0,
                TokensOutput = 0,
                Sources = new List<SourceEntryDto>(),
                IsActive = aiMessage.IsActive,
                CreatedAt = aiMessage.CreatedAt
            };
        }

        private static ChatMessageResponse _mapTerminalSourceMessage(
            ChatMessageDomain sourceMessage,
            string? errorMessage)
        {
            return new ChatMessageResponse
            {
                MessageId = sourceMessage.Id,
                ConversationId = sourceMessage.ConversationId,
                SenderRole = sourceMessage.SenderRole.ToString(),
                Status = sourceMessage.Status.ToString(),
                Content = string.IsNullOrWhiteSpace(errorMessage) ? sourceMessage.Content : errorMessage,
                Intent = sourceMessage.Intent,
                UrgencyLevel = sourceMessage.UrgencyLevel,
                VetRecommendation = sourceMessage.VetRecommendation,
                RagUsed = sourceMessage.RagUsed,
                ChunksUsed = sourceMessage.ChunksUsed,
                Model = sourceMessage.Model,
                TokensInput = sourceMessage.TokensInput,
                TokensOutput = sourceMessage.TokensOutput,
                Sources = new List<SourceEntryDto>(),
                IsActive = sourceMessage.IsActive,
                CreatedAt = sourceMessage.CreatedAt
            };
        }
    }
}
