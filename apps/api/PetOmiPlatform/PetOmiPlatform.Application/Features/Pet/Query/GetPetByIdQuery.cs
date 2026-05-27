using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Query
{
    // Query lấy thông tin 1 pet theo ID
    public record GetPetByIdQuery(Guid UserId, Guid PetId) : IRequest<PetResponse>;
}
