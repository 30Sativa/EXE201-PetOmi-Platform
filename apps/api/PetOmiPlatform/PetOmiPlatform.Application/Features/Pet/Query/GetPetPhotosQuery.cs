using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.Pet.Query
{
    public record GetPetPhotosQuery(Guid UserId, Guid PetId) : IRequest<List<PetPhotoResponse>>;
}
