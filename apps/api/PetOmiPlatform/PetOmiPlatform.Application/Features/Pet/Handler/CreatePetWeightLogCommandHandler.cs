using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
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
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreatePetWeightLogCommandHandler(
            IPetRepository petRepository,
            IPetWeightLogRepository weightLogRepository,
            IPetHealthProfileRepository healthProfileRepository,
            IPetUserAccessRepository accessRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _weightLogRepository = weightLogRepository;
            _healthProfileRepository = healthProfileRepository;
            _accessRepository = accessRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetWeightLogResponse> Handle(CreatePetWeightLogCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanWrite(pet, command.UserId);

            var weightLog = PetWeightLogDomain.Create(
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

        private async Task EnsureCanWrite(PetDomain pet, Guid userId)
        {
            if (pet.OwnerUserId == userId) return;
            var access = await _accessRepository.GetByPetAndUserAsync(pet.Id, userId);
            if (access == null || !access.CanWrite())
                throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này.");
        }
    }
}
