using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class GetPetPhotosQueryHandler : IRequestHandler<GetPetPhotosQuery, List<PetPhotoResponse>>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetPhotoRepository _photoRepository;
        private readonly IPetAccessService _accessService;

        public GetPetPhotosQueryHandler(
            IPetRepository petRepository,
            IPetPhotoRepository photoRepository,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _accessService = accessService;
        }

        public async Task<List<PetPhotoResponse>> Handle(GetPetPhotosQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanReadAsync(pet, query.UserId, cancellationToken);

            var photos = await _photoRepository.GetByPetIdAsync(query.PetId);

            return photos.Select(p => new PetPhotoResponse
            {
                PhotoId = p.Id,
                PetId = p.PetId,
                ImageUrl = p.ImageUrl,
                CloudinaryPublicId = p.CloudinaryPublicId,
                Caption = p.Caption,
                IsAvatar = p.IsAvatar,
                TakenAt = p.TakenAt,
                CreatedAt = p.CreatedAt
            }).ToList();
        }
    }
}
