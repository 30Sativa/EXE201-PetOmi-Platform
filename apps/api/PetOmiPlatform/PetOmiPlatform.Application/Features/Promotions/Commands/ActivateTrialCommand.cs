using MediatR;
using PetOmiPlatform.Application.Features.Promotions.DTOs;

namespace PetOmiPlatform.Application.Features.Promotions.Commands;

public record ActivateTrialCommand(Guid UserId) : IRequest<ActivateTrialResponse>;
