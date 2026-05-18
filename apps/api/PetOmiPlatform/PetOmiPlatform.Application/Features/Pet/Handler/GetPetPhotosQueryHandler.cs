using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Domain.Entities;
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
        private readonly IPetUserAccessRepository _accessRepository;

        public GetPetPhotosQueryHandler(
            IPetRepository petRepository,
            IPetPhotoRepository photoRepository,
            IPetUserAccessRepository accessRepository)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _accessRepository = accessRepository;
        }

        public async Task<List<PetPhotoResponse>> Handle(GetPetPhotosQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanRead(pet, query.UserId);

            var photos = await _photoRepository.GetByPetIdAsync(query.PetId);

            return photos.Select(p => new PetPhotoResponse
            {
                PhotoId = p.Id,
                PetId = p.PetId,
                ImageUrl = p.ImageUrl,
                Caption = p.Caption,
                IsAvatar = p.IsAvatar,
                TakenAt = p.TakenAt,
                CreatedAt = p.CreatedAt
            }).ToList();
        }

        private async Task EnsureCanRead(PetDomain pet, Guid userId)
        {
            if (pet.OwnerUserId == userId) return;
            var access = await _accessRepository.GetByPetAndUserAsync(pet.Id, userId);
            if (access == null || !access.CanRead())
                throw new ForbiddenException("Bạn không có quyền xem thông tin này.");
        }
    }
}
