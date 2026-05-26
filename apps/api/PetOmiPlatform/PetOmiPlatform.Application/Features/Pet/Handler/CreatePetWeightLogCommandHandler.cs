using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class CreatePetWeightLogCommandHandler : IRequestHandler<CreatePetWeightLogCommand, PetWeightLogResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetWeightLogRepository _weightLogRepository;
        private readonly IPetHealthProfileRepository _healthProfileRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public CreatePetWeightLogCommandHandler(
            IPetRepository petRepository,
            IPetWeightLogRepository weightLogRepository,
            IPetHealthProfileRepository healthProfileRepository,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _weightLogRepository = weightLogRepository;
            _healthProfileRepository = healthProfileRepository;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task<PetWeightLogResponse> Handle(CreatePetWeightLogCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            var weightLog = Domain.Entities.PetWeightLogDomain.Create(
                petId: command.PetId,
                weightKg: command.Request.WeightKg,
                measuredAt: command.Request.MeasuredAt,
                source: command.Request.Source,
                note: command.Request.Note
            );

            await _weightLogRepository.AddAsync(weightLog);

            var profile = await _healthProfileRepository.GetByPetIdAsync(command.PetId);
            if (profile != null)
            {
                profile.UpdateHealthInfo(
                    profile.CurrentWeightKg,
                    profile.Color,
                    profile.IsNeutered,
                    profile.Allergies,
                    profile.ChronicConditions,
                    profile.MicrochipNumber
                );
                await _healthProfileRepository.UpdateAsync(profile);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PetWeightLogResponse
            {
                WeightLogId = weightLog.Id,
                PetId = weightLog.PetId,
                WeightKg = weightLog.WeightKg,
                MeasuredAt = weightLog.MeasuredAt,
                Source = weightLog.Source,
                Note = weightLog.Note,
                CreatedAt = weightLog.CreatedAt
            };
        }
    }
}
