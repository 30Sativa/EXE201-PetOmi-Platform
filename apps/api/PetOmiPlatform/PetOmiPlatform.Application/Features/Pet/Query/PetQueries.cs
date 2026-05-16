using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.Pet.Query
{
    // Query lấy thông tin 1 pet theo ID
    public record GetPetByIdQuery(Guid UserId, Guid PetId) : IRequest<PetResponse>;

    // Query lấy danh sách tất cả pet của owner hiện tại
    public record GetMyPetsQuery(Guid UserId) : IRequest<List<PetResponse>>;
}
