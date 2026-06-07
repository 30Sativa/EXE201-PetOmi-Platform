using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.PetHealthShare.Command;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;
using PetOmiPlatform.Application.Features.PetHealthShare.Mappers;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Handler
{
    public class CreatePetHealthShareCommandHandler : IRequestHandler<CreatePetHealthShareCommand, PetHealthShareResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IClinicRepository _clinicRepository;
        private readonly IPetHealthShareTokenRepository _shareTokenRepository;
        private readonly IPetCodeGenerator _petCodeGenerator;
        private readonly IShareCodeHasher _shareCodeHasher;
        private readonly IPetAccessService _accessService;
        private readonly IUnitOfWork _unitOfWork;

        public CreatePetHealthShareCommandHandler(
            IPetRepository petRepository,
            IClinicRepository clinicRepository,
            IPetHealthShareTokenRepository shareTokenRepository,
            IPetCodeGenerator petCodeGenerator,
            IShareCodeHasher shareCodeHasher,
            IPetAccessService accessService,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _clinicRepository = clinicRepository;
            _shareTokenRepository = shareTokenRepository;
            _petCodeGenerator = petCodeGenerator;
            _shareCodeHasher = shareCodeHasher;
            _accessService = accessService;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetHealthShareResponse> Handle(
            CreatePetHealthShareCommand command,
            CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Khong tim thay ho so thu cung.");

            await _accessService.EnsureOwnerAsync(pet, command.RequestUserId, cancellationToken);

            if (command.Request.ClinicId.HasValue)
            {
                var clinic = await _clinicRepository.GetByIdAsync(command.Request.ClinicId.Value)
                    ?? throw new NotFoundException("Clinic", command.Request.ClinicId.Value);
                clinic.EnsureApproved();
            }

            var nowUtc = DateTime.UtcNow;
            var expiresAt = command.Request.ExpiresAt ?? nowUtc.AddHours(24);
            if (expiresAt > nowUtc.AddDays(7))
                throw new ValidationException("ExpiresAt", "ExpiresAt cannot be more than 7 days from now for MVP.");

            var scope = Enum.Parse<PetHealthShareScope>(command.Request.Scope, true);
            var accessMode = Enum.Parse<PetHealthShareAccessMode>(command.Request.AccessMode, true);
            var maxUses = accessMode == PetHealthShareAccessMode.OneTime
                ? 1
                : command.Request.MaxUses;

            var displayCode = await GenerateUniqueShareCodeAsync();
            var tokenHash = _shareCodeHasher.Hash(displayCode);

            var shareToken = PetHealthShareTokenDomain.Create(
                petId: command.PetId,
                ownerUserId: pet.OwnerUserId,
                clinicId: command.Request.ClinicId,
                displayCode: displayCode,
                tokenHash: tokenHash,
                scope: scope,
                accessMode: accessMode,
                expiresAt: expiresAt,
                maxUses: maxUses,
                createdByUserId: command.RequestUserId,
                note: command.Request.Note);

            await _shareTokenRepository.AddAsync(shareToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return shareToken.ToResponse(nowUtc);
        }

        private async Task<string> GenerateUniqueShareCodeAsync()
        {
            for (var attempt = 0; attempt < 10; attempt++)
            {
                var code = _petCodeGenerator.GenerateHealthShareCode();
                if (!await _shareTokenRepository.DisplayCodeExistsAsync(code))
                    return code;
            }

            throw new ConflictException("Khong the tao ma chia se ho so suc khoe. Vui long thu lai.");
        }
    }
}
