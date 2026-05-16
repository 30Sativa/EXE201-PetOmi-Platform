using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    // Command tạo hồ sơ thú cưng mới — mang UserId để xác định chủ nuôi
    public record CreatePetCommand(Guid UserId, CreatePetRequest Request) : IRequest<PetResponse>;
}
