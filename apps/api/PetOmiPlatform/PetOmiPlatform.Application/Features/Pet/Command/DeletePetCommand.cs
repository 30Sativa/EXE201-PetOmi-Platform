using MediatR;
using System;

namespace PetOmiPlatform.Application.Features.Pet.Command
{
    // Command xóa mềm thú cưng — không trả về data, chỉ trả về void (IRequest không generic)
    public record DeletePetCommand(Guid UserId, Guid PetId) : IRequest;
}
