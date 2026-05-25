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
    public class GetPetWeightLogsQueryHandler : IRequestHandler<GetPetWeightLogsQuery, List<PetWeightLogResponse>>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetWeightLogRepository _weightLogRepository;
        private readonly IPetAccessService _accessService;

        public GetPetWeightLogsQueryHandler(
            IPetRepository petRepository,
            IPetWeightLogRepository weightLogRepository,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _weightLogRepository = weightLogRepository;
            _accessService = accessService;
        }

        public async Task<List<PetWeightLogResponse>> Handle(GetPetWeightLogsQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanReadAsync(pet, query.UserId, cancellationToken);

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
    }
}
