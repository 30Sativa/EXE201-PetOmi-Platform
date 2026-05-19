using MediatR;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Auth.Queries
{
    public record GetCurrentUserQuery(Guid UserId) : IRequest<GetCurrentUserResponse>;
}
