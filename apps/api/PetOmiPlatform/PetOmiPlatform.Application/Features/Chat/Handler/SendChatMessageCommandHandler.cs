using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Chat.Command;
using PetOmiPlatform.Application.Features.Chat.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Chat.Handler
{
    public class SendChatMessageCommandHandler : IRequestHandler<SendChatMessageCommand, SendChatMessageResponse>
    {
        private readonly IConversationRepository _conversationRepository;
        private readonly IChatMessageRepository _chatMessageRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAiServiceClient _aiServiceClient;
        private readonly IPetRepository _petRepository;
        private readonly IPetAccessService _petAccessService;
        private readonly IChatSubscriptionAccessService _chatSubscriptionAccessService;

        public SendChatMessageCommandHandler(
            IConversationRepository conversationRepository,
            IChatMessageRepository chatMessageRepository,
            IUnitOfWork unitOfWork,
            IAiServiceClient aiServiceClient,
            IPetRepository petRepository,
            IPetAccessService petAccessService,
            IChatSubscriptionAccessService chatSubscriptionAccessService)
        {
            _conversationRepository = conversationRepository;
            _chatMessageRepository = chatMessageRepository;
            _unitOfWork = unitOfWork;
            _aiServiceClient = aiServiceClient;
            _petRepository = petRepository;
            _petAccessService = petAccessService;
            _chatSubscriptionAccessService = chatSubscriptionAccessService;
        }

        public async Task<SendChatMessageResponse> Handle(SendChatMessageCommand command, CancellationToken ct)
        {
            ConversationDomain conversation;
            Guid? effectivePetId;

            if (command.Request.ConversationId.HasValue)
            {
                conversation = await _conversationRepository.GetByIdAsync(command.Request.ConversationId.Value)
                    ?? throw new InvalidOperationException("Conversation not found.");

                if (conversation.UserId != command.UserId)
                    throw new UnauthorizedAccessException("You do not have access to this conversation.");

                if (!conversation.PetId.HasValue && command.Request.PetId.HasValue)
                {
                    var pet = await _petRepository.GetByIdAsync(command.Request.PetId.Value)
                        ?? throw new NotFoundException("Pet", command.Request.PetId.Value);
                    pet.EnsureActive();
                    await _petAccessService.EnsureCanReadAsync(pet, command.UserId, ct);

                    conversation.AttachPet(command.Request.PetId.Value);
                    await _conversationRepository.UpdateAsync(conversation);
                }

                effectivePetId = conversation.PetId;
            }
            else
            {
                if (command.Request.PetId.HasValue)
                {
                    var pet = await _petRepository.GetByIdAsync(command.Request.PetId.Value)
                        ?? throw new NotFoundException("Pet", command.Request.PetId.Value);
                    pet.EnsureActive();
                    await _petAccessService.EnsureCanReadAsync(pet, command.UserId, ct);
                }

                effectivePetId = command.Request.PetId;
                conversation = ConversationDomain.Create(
                    command.UserId,
                    effectivePetId,
                    BuildConversationTitle(command.Request.Content));
                await _conversationRepository.AddAsync(conversation);
            }

            var chatAccess = await _chatSubscriptionAccessService.GetAccessAsync(
                command.UserId,
                effectivePetId,
                ct);

            if (!chatAccess.CanSend)
            {
                throw new ConflictException(
                    chatAccess.BlockReason ??
                    "Ban da dung het quota PetOmi AI trong chu ky hien tai.");
            }

            var message = ChatMessageDomain.CreateUserMessage(
                conversationId: conversation.Id,
                content: command.Request.Content
            );

            if (command.Request.ConversationId.HasValue)
            {
                conversation.Touch();
                await _conversationRepository.UpdateAsync(conversation);
            }

            await _chatMessageRepository.AddAsync(message);
            await _unitOfWork.SaveChangesAsync(ct);

            await _aiServiceClient.EnqueueChatAsync(
                messageId: message.Id,
                conversationId: conversation.Id,
                userId: command.UserId,
                content: command.Request.Content,
                petId: effectivePetId,
                subscriptionPlan: chatAccess.PlanCode,
                priorityLevel: chatAccess.PriorityLevel,
                deepRagEnabled: chatAccess.DeepRagEnabled,
                cancellationToken: ct
            );

            return new SendChatMessageResponse
            {
                MessageId = message.Id,
                ConversationId = conversation.Id,
                Status = message.Status.ToString(),
                CreatedAt = message.CreatedAt
            };
        }

        private static string BuildConversationTitle(string content)
        {
            var title = string.Join(" ", content.Split(
                new[] { ' ', '\r', '\n', '\t' },
                StringSplitOptions.RemoveEmptyEntries));
            if (title.Length > 72)
            {
                return title[..72];
            }

            return string.IsNullOrWhiteSpace(title) ? "Cuộc trò chuyện mới" : title;
        }
    }
}
