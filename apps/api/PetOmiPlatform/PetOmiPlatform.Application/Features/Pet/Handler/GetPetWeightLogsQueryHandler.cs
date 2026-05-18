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
    public class GetPetWeightLogsQueryHandler : IRequestHandler<GetPetWeightLogsQuery, List<PetWeightLogResponse>>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetWeightLogRepository _weightLogRepository;
        private readonly IPetUserAccessRepository _accessRepository;

        public GetPetWeightLogsQueryHandler(
            IPetRepository petRepository,
            IPetWeightLogRepository weightLogRepository,
            IPetUserAccessRepository accessRepository)
        {
            _petRepository = petRepository;
            _weightLogRepository = weightLogRepository;
            _accessRepository = accessRepository;
        }

        public async Task<List<PetWeightLogResponse>> Handle(GetPetWeightLogsQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanRead(pet, query.UserId);

            var weightLogs = await _weightLogRepository.GetByPetIdAsync(query.PetId);

            return weightLogs.Select(w => new PetWeightLogResponse
            {
                WeightLogId = w.Id,
                PetId = w.PetId,
                WeightKg = w.WeightKg,
                MeasuredAt = w.MeasuredAt,
                Source = w.Source,
                Note = w.Note,
                CreatedAt = w.CreatedAt
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
