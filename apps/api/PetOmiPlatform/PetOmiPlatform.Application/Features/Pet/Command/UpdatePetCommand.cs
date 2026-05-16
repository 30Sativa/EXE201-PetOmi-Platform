using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    // Command cập nhật hồ sơ thú cưng — PetId để xác định pet, UserId để kiểm tra quyền
    public record UpdatePetCommand(Guid UserId, Guid PetId, UpdatePetRequest Request) : IRequest<PetResponse>;
}
